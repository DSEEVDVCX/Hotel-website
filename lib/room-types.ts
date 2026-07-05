import { prisma } from "@/lib/db";
import {
  getActiveRoomTypes,
  writeRoomType,
  deleteRoomType,
  writeHotelPublic,
} from "@/lib/firebase";

export type RoomTypeSummary = {
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
  starRating: number;
  hotelNameAr: string;
  hotelNameEn: string;
  city: string;
};

export type RoomTypeDetail = RoomTypeSummary & {
  gallery: Array<{ url: string; captionAr: string | null; captionEn: string | null; sortOrder: number }>;
  hotel: {
    id: string;
    nameAr: string;
    nameEn: string;
    city: string;
    address: string;
    starRating: number;
    amenities: string[];
    checkInTime: string;
    checkOutTime: string;
    cancellationPolicyHours: number;
    photos: string[];
  };
  availableRoomsCount: number;
};

function toNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof value === "object" && value !== null) {
    const v = value as { toNumber?: () => number };
    if (typeof v.toNumber === "function") return v.toNumber();
  }
  return 0;
}

export async function getAllRoomTypes(): Promise<RoomTypeSummary[]> {
  // Prefer Firebase (denormalized catalog); fall back to Postgres when disabled/empty.
  const fb = await getActiveRoomTypes();
  if (fb && fb.length > 0) {
    return fb.map((rt) => ({
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
      starRating: rt.starRating,
      hotelNameAr: rt.hotelNameAr,
      hotelNameEn: rt.hotelNameEn,
      city: rt.city,
    }));
  }

  const roomTypes = await prisma.roomType.findMany({
    where: { hotel: { status: "ACTIVE" } },
    include: {
      hotel: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          city: true,
          starRating: true,
          status: true,
        },
      },
      rooms: {
        where: { status: "AVAILABLE" },
        select: { id: true },
      },
    },
    orderBy: { basePrice: "asc" },
  });

  return roomTypes.map((rt) => ({
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
    starRating: rt.hotel.starRating,
    hotelNameAr: rt.hotel.nameAr,
    hotelNameEn: rt.hotel.nameEn,
    city: rt.hotel.city,
  }));
}

export async function getRoomTypeById(id: string): Promise<RoomTypeDetail | null> {
  const rt = await prisma.roomType.findUnique({
    where: { id },
    include: {
      hotel: {
        select: {
          id: true,
          nameAr: true,
          nameEn: true,
          city: true,
          address: true,
          starRating: true,
          amenities: true,
          checkInTime: true,
          checkOutTime: true,
          cancellationPolicyHours: true,
          photos: true,
          status: true,
        },
      },
      rooms: {
        where: { status: "AVAILABLE" },
        select: { id: true },
      },
      rates: true,
    },
  });

  if (!rt || rt.hotel.status !== "ACTIVE") return null;

  const gallery = Array.isArray(rt.photos) && rt.photos.length > 0
    ? rt.photos.map((url, i) => ({ url, captionAr: rt.nameAr, captionEn: rt.nameEn, sortOrder: i }))
    : Array.from({ length: 4 }).map((_, i) => ({ url: `https://picsum.photos/seed/sewar-room-${id.slice(-4)}-${i}/800/600`, captionAr: rt.nameAr, captionEn: rt.nameEn, sortOrder: i }));

  return {
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
    starRating: rt.hotel.starRating,
    hotelNameAr: rt.hotel.nameAr,
    hotelNameEn: rt.hotel.nameEn,
    city: rt.hotel.city,
    gallery,
    hotel: {
      id: rt.hotel.id,
      nameAr: rt.hotel.nameAr,
      nameEn: rt.hotel.nameEn,
      city: rt.hotel.city,
      address: rt.hotel.address,
      starRating: rt.hotel.starRating,
      amenities: Array.isArray(rt.hotel.amenities) ? rt.hotel.amenities : [],
      checkInTime: rt.hotel.checkInTime,
      checkOutTime: rt.hotel.checkOutTime,
      cancellationPolicyHours: rt.hotel.cancellationPolicyHours,
      photos: Array.isArray(rt.hotel.photos) ? rt.hotel.photos : [],
    },
    availableRoomsCount: rt.rooms.length,
  };
}

/**
 * Write-through one room-type to Firebase as a denormalized catalog record
 * (reads the hotel + available-room count from Postgres). Best-effort: no-ops
 * when Firebase is disabled. Call after create/update of a room-type.
 */
export async function syncRoomTypeToFirebase(roomTypeId: string): Promise<void> {
  const rt = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: {
      hotel: {
        select: { nameAr: true, nameEn: true, city: true, starRating: true, status: true },
      },
      rooms: { where: { status: "AVAILABLE" }, select: { id: true } },
    },
  });
  if (!rt) return;
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

/** Remove a room-type from the Firebase catalog. */
export async function removeRoomTypeFromFirebase(roomTypeId: string): Promise<void> {
  await deleteRoomType(roomTypeId);
}

/**
 * Write-through a hotel's public fields, then re-denormalize all of its
 * room-types (their records carry the hotel status, which gates public
 * visibility). Call after a hotel status change (approve/suspend/reinstate).
 */
export async function syncHotelToFirebase(hotelId: string): Promise<void> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { id: true, nameAr: true, nameEn: true, city: true, starRating: true, status: true },
  });
  if (!hotel) return;
  await writeHotelPublic(hotel);
  const roomTypes = await prisma.roomType.findMany({
    where: { hotelId },
    select: { id: true },
  });
  for (const rt of roomTypes) {
    await syncRoomTypeToFirebase(rt.id);
  }
}
