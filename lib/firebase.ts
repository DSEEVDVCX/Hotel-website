import type { Database } from "firebase-admin/database";

/**
 * Firebase Realtime Database (Admin SDK) — lazy singleton.
 *
 * Mirrors the lazy-init pattern in lib/db.ts. Credentials come from the
 * environment so nothing sensitive is committed. Provide the service account in
 * ONE of two ways:
 *   - FIREBASE_SERVICE_ACCOUNT      : the full key JSON as a single-line string, OR
 *   - FIREBASE_SERVICE_ACCOUNT_PATH : a path to the downloaded key .json file
 * plus:
 *   - FIREBASE_DATABASE_URL         : e.g. https://sewar-alandalus-default-rtdb.firebaseio.com
 *
 * During the phased migration Postgres remains the source of truth. Firebase
 * is written through as a durable copy, so if it is not configured (or is
 * unreachable) the core flow must still succeed. getDb() therefore returns
 * null when unconfigured, and callers swallow-and-log any failure instead of
 * throwing.
 */

let _db: Database | null = null;
let _initTried = false;

function loadServiceAccount(): string | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) return inline;
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (filePath) {
    try {
      const fs = require("fs");
      return fs.readFileSync(filePath, "utf8");
    } catch (err) {
      console.error("[firebase] could not read FIREBASE_SERVICE_ACCOUNT_PATH:", err);
      return null;
    }
  }
  return null;
}

function getDb(): Database | null {
  if (_db) return _db;
  if (_initTried) return _db; // already tried and failed/absent — don't spam
  _initTried = true;

  const raw = loadServiceAccount();
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  if (!raw || !databaseURL) {
    console.warn(
      "[firebase] service account / FIREBASE_DATABASE_URL not set — " +
        "skipping Firebase (Postgres remains source of truth)."
    );
    return null;
  }

  try {
    // Required lazily so the app doesn't pay the cost unless Firebase is used.
    const { getApps, initializeApp, cert } = require("firebase-admin/app");
    const { getDatabase } = require("firebase-admin/database");

    const serviceAccount = JSON.parse(raw);
    const app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp({ credential: cert(serviceAccount), databaseURL });

    _db = getDatabase(app);
    return _db;
  } catch (err) {
    console.error("[firebase] initialization failed:", err);
    return null;
  }
}

/** True when Firebase credentials are configured and init succeeded. */
export function isFirebaseEnabled(): boolean {
  return getDb() !== null;
}

/**
 * RTDB keys may not contain '.', '#', '$', '[', ']' or '/'. Emails contain
 * dots (and sometimes '+'), so we encode them for use as an index key.
 */
export function sanitizeEmail(email: string): string {
  return encodeURIComponent(email.toLowerCase()).replace(/\./g, "%2E");
}

export type FirebaseUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  passwordHash?: string | null;
  createdAt: string;
};

/**
 * Write-through a user record to RTDB at users/{id} plus an email→uid index at
 * usersByEmail/{sanitizedEmail}. Never throws — logs and returns false so the
 * caller's primary (Postgres) flow is unaffected.
 *
 * passwordHash is stored ONLY so auth can read from Firebase (bcrypt hash, never
 * plaintext). Lock down `users/` with Firebase security rules so it is not
 * publicly readable.
 */
export async function writeUser(user: {
  id: string;
  email: string;
  name: string;
  role: string;
  status?: string;
  passwordHash?: string | null;
  createdAt?: Date | string;
}): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    const record: FirebaseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status ?? "ACTIVE",
      createdAt:
        user.createdAt instanceof Date
          ? user.createdAt.toISOString()
          : user.createdAt ?? new Date().toISOString(),
    };
    if (user.passwordHash != null) record.passwordHash = user.passwordHash;

    const updates: Record<string, unknown> = {
      [`users/${user.id}`]: record,
      [`usersByEmail/${sanitizeEmail(user.email)}`]: user.id,
    };
    await db.ref().update(updates);
    return true;
  } catch (err) {
    console.error("[firebase] writeUser failed:", err);
    return false;
  }
}

/**
 * Read a user (incl. passwordHash) by email via the usersByEmail index.
 * Returns null when Firebase is disabled or the user is not found, so callers
 * fall back to Postgres.
 */
export async function getUserByEmail(email: string): Promise<FirebaseUser | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const uidSnap = await db.ref(`usersByEmail/${sanitizeEmail(email)}`).get();
    const uid = uidSnap.val();
    if (!uid) return null;
    const userSnap = await db.ref(`users/${uid}`).get();
    return (userSnap.val() as FirebaseUser | null) ?? null;
  } catch (err) {
    console.error("[firebase] getUserByEmail failed:", err);
    return null;
  }
}

/**
 * Write-through a review to RTDB at reviews/{hotelId}/{reviewId}.
 * Never throws — logs and returns false on failure.
 */
export async function writeReview(review: {
  id: string;
  hotelId: string;
  guestId: string;
  guestName?: string | null;
  rating: number;
  commentAr?: string | null;
  commentEn?: string | null;
  createdAt?: Date | string;
}): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db.ref(`reviews/${review.hotelId}/${review.id}`).set({
      id: review.id,
      hotelId: review.hotelId,
      guestId: review.guestId,
      guestName: review.guestName ?? null,
      rating: review.rating,
      commentAr: review.commentAr ?? null,
      commentEn: review.commentEn ?? null,
      createdAt:
        review.createdAt instanceof Date
          ? review.createdAt.toISOString()
          : review.createdAt ?? new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("[firebase] writeReview failed:", err);
    return false;
  }
}

export type FirebaseReview = {
  id: string;
  hotelId: string;
  guestId: string;
  guestName?: string | null;
  rating: number;
  commentAr?: string | null;
  commentEn?: string | null;
  createdAt: string;
};

/**
 * Read all reviews for a hotel from reviews/{hotelId}, newest first.
 * Returns null when Firebase is disabled or has no data for the hotel, so the
 * caller falls back to Postgres. (An empty hotel node reads as null.)
 */
export async function getReviewsByHotel(
  hotelId: string
): Promise<FirebaseReview[] | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await db.ref(`reviews/${hotelId}`).get();
    const val = snap.val() as Record<string, FirebaseReview> | null;
    if (!val) return null;
    return Object.values(val).sort((a, b) =>
      (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
    );
  } catch (err) {
    console.error("[firebase] getReviewsByHotel failed:", err);
    return null;
  }
}

/**
 * Denormalized room-type record for the public catalog — carries the hotel
 * fields the homepage/detail need so reads require no join. Images stay as URL
 * strings (never uploaded to Firebase).
 */
export type FirebaseRoomType = {
  id: string;
  hotelId: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  capacity: number;
  bedType: string;
  basePrice: number;
  amenities: string[];
  photos: string[];
  availableRoomsCount: number;
  hotelNameAr: string;
  hotelNameEn: string;
  city: string;
  starRating: number;
  hotelStatus: string;
};

/** Write-through a denormalized room-type to roomTypes/{id}. */
export async function writeRoomType(rt: FirebaseRoomType): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db.ref(`roomTypes/${rt.id}`).set(rt);
    return true;
  } catch (err) {
    console.error("[firebase] writeRoomType failed:", err);
    return false;
  }
}

/** Remove a room-type from roomTypes/{id}. */
export async function deleteRoomType(id: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db.ref(`roomTypes/${id}`).remove();
    return true;
  } catch (err) {
    console.error("[firebase] deleteRoomType failed:", err);
    return false;
  }
}

/**
 * All room-types belonging to ACTIVE hotels, sorted by basePrice asc.
 * Returns null when Firebase is disabled/empty so the caller falls back to Postgres.
 */
export async function getActiveRoomTypes(): Promise<FirebaseRoomType[] | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await db.ref("roomTypes").get();
    const val = snap.val() as Record<string, FirebaseRoomType> | null;
    if (!val) return null;
    return Object.values(val)
      .filter((rt) => rt.hotelStatus === "ACTIVE")
      .sort((a, b) => a.basePrice - b.basePrice);
  } catch (err) {
    console.error("[firebase] getActiveRoomTypes failed:", err);
    return null;
  }
}

/** One room-type by id, or null (disabled / not found / inactive hotel). */
export async function getRoomTypeById(
  id: string
): Promise<FirebaseRoomType | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const snap = await db.ref(`roomTypes/${id}`).get();
    const rt = snap.val() as FirebaseRoomType | null;
    if (!rt || rt.hotelStatus !== "ACTIVE") return null;
    return rt;
  } catch (err) {
    console.error("[firebase] getRoomTypeById failed:", err);
    return null;
  }
}

/** Write-through public hotel fields to hotels/{id}. */
export async function writeHotelPublic(hotel: {
  id: string;
  nameAr: string;
  nameEn: string;
  city: string;
  starRating: number;
  status: string;
}): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  try {
    await db.ref(`hotels/${hotel.id}`).set(hotel);
    return true;
  } catch (err) {
    console.error("[firebase] writeHotelPublic failed:", err);
    return false;
  }
}
