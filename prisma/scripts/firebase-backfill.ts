/**
 * One-off, idempotent backfill: copies existing Postgres data into Firebase
 * Realtime Database so the Firebase-first read paths have data to serve.
 *
 * Copies:
 *   - users       → users/{id}  (incl. bcrypt passwordHash) + usersByEmail/{email}
 *   - reviews     → reviews/{hotelId}/{id}
 *   - hotels      → hotels/{id}  (public fields)
 *   - roomTypes   → roomTypes/{id}  (denormalized with hotel fields)
 *
 * Images are NOT copied — photos remain URL strings on their records.
 *
 * SECURITY: users/ contains bcrypt password hashes. Set Firebase security rules
 * so users/ and usersByEmail/ are NOT publicly readable (admin SDK bypasses
 * rules; only your server should read them).
 *
 * Run once after setting FIREBASE_SERVICE_ACCOUNT + FIREBASE_DATABASE_URL:
 *   npm run db:firebase-backfill
 * Re-running is safe (writes are keyed by id and overwrite).
 */
import { config } from "dotenv";
config();
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";
import {
  isFirebaseEnabled,
  writeUser,
  writeReview,
  writeHotelPublic,
  writeRoomType,
} from "../../lib/firebase";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function toNumber(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = Number(v as string);
  return Number.isFinite(n) ? n : 0;
}

async function main() {
  if (!isFirebaseEnabled()) {
    console.error(
      "Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT and " +
        "FIREBASE_DATABASE_URL in your environment before running the backfill."
    );
    process.exit(1);
  }

  // Users (with password hash + email index)
  const users = await prisma.user.findMany();
  for (const u of users) {
    await writeUser({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      passwordHash: u.passwordHash,
      createdAt: u.createdAt,
    });
  }
  console.log(`✓ users: ${users.length}`);

  // Hotels (public fields)
  const hotels = await prisma.hotel.findMany({
    select: { id: true, nameAr: true, nameEn: true, city: true, starRating: true, status: true },
  });
  for (const h of hotels) {
    await writeHotelPublic(h);
  }
  console.log(`✓ hotels: ${hotels.length}`);

  // Room types (denormalized with hotel fields + available-room count)
  const roomTypes = await prisma.roomType.findMany({
    include: {
      hotel: {
        select: { nameAr: true, nameEn: true, city: true, starRating: true, status: true },
      },
      rooms: { where: { status: "AVAILABLE" }, select: { id: true } },
    },
  });
  for (const rt of roomTypes) {
    await writeRoomType({
      id: rt.id,
      hotelId: rt.hotelId,
      nameAr: rt.nameAr,
      nameEn: rt.nameEn,
      descriptionAr: rt.descriptionAr,
      descriptionEn: rt.descriptionEn,
      capacity: rt.capacity,
      bedType: rt.bedType,
      basePrice: toNumber(rt.basePrice),
      amenities: Array.isArray(rt.amenities) ? rt.amenities : [],
      photos: Array.isArray(rt.photos) ? rt.photos : [],
      availableRoomsCount: rt.rooms.length,
      hotelNameAr: rt.hotel.nameAr,
      hotelNameEn: rt.hotel.nameEn,
      city: rt.hotel.city,
      starRating: rt.hotel.starRating,
      hotelStatus: rt.hotel.status,
    });
  }
  console.log(`✓ roomTypes: ${roomTypes.length}`);

  // Reviews
  const reviews = await prisma.review.findMany({
    include: { guest: { select: { name: true } } },
  });
  for (const r of reviews) {
    await writeReview({
      id: r.id,
      hotelId: r.hotelId,
      guestId: r.guestId,
      guestName: r.guest?.name ?? null,
      rating: r.rating,
      commentAr: r.commentAr,
      commentEn: r.commentEn,
      createdAt: r.createdAt,
    });
  }
  console.log(`✓ reviews: ${reviews.length}`);

  console.log("Backfill complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    // firebase-admin keeps its connection open, which would keep the process
    // alive; exit explicitly now that all writes are done.
    process.exit(0);
  });
