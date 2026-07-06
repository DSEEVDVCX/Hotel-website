import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/session";
import { parseEnumParam } from "@/lib/validation";
import { HotelStatus } from "@prisma/client";

const hotelStatuses = Object.values(HotelStatus);

export async function GET(req: NextRequest) {
  const session = await requirePlatformAdmin();
  if (session instanceof NextResponse) return session;

  const status = parseEnumParam(req.nextUrl.searchParams.get("status"), hotelStatuses);
  if (status === null) {
    return NextResponse.json({ error: "Invalid hotel status" }, { status: 422 });
  }
  const hotels = await prisma.hotel.findMany({
    where: status ? { status } : {},
    include: {
      owner: { select: { name: true } },
      featuredSelection: { select: { sortOrder: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const hotelsWithFeatured = hotels.map((h) => {
    const { featuredSelection, ...rest } = h;
    return {
      ...rest,
      isFeatured: featuredSelection !== null,
      featuredSortOrder: featuredSelection ? featuredSelection.sortOrder : null,
    };
  });

  return NextResponse.json({ hotels: hotelsWithFeatured });
}

export async function POST(req: NextRequest) {
  const session = await requirePlatformAdmin();
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const {
    nameAr,
    nameEn,
    descriptionAr,
    descriptionEn,
    city,
    address,
    starRating,
    amenities,
    photos,
    latitude,
    longitude,
  } = body;

  if (!nameAr || !nameEn || !descriptionAr || !descriptionEn || !city || !address || !starRating) {
    return NextResponse.json(
      { error: "nameAr, nameEn, descriptionAr, descriptionEn, city, address, and starRating are required" },
      { status: 422 }
    );
  }

  const parsedStarRating = Number(starRating);
  if (!Number.isInteger(parsedStarRating) || parsedStarRating < 1 || parsedStarRating > 5) {
    return NextResponse.json({ error: "starRating must be between 1 and 5" }, { status: 422 });
  }

  let ownerId = session.userId;
  if (ownerId === "fallback-admin") {
    const fallbackOwner = await prisma.user.upsert({
      where: { email: "admin" },
      update: { role: "ADMIN", isPlatformAdmin: true, status: "ACTIVE" },
      create: {
        id: ownerId,
        email: "admin",
        passwordHash: "managed-admin-login",
        name: "Admin",
        role: "ADMIN",
        isPlatformAdmin: true,
      },
    });
    ownerId = fallbackOwner.id;
  }

  const hotel = await prisma.hotel.create({
    data: {
      ownerId,
      nameAr,
      nameEn,
      descriptionAr,
      descriptionEn,
      city,
      address,
      latitude: latitude === undefined || latitude === "" ? null : Number(latitude),
      longitude: longitude === undefined || longitude === "" ? null : Number(longitude),
      starRating: parsedStarRating,
      amenities: Array.isArray(amenities) ? amenities : [],
      photos: Array.isArray(photos) ? photos : [],
      status: "ACTIVE",
    },
  });

  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath("/search");

  return NextResponse.json(hotel, { status: 201 });
}
