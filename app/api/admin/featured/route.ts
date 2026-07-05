import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requirePlatformAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import { createFeaturedSchema } from "@/lib/schemas/featured";

export async function GET() {
  const session = await requirePlatformAdmin();
  if (session instanceof NextResponse) return session;

  const featured = await prisma.featuredSelection.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      hotel: { select: { nameAr: true, nameEn: true, city: true } },
    },
  });

  const result = featured.map((f) => ({
    id: f.id,
    hotelId: f.hotelId,
    hotelNameAr: f.hotel.nameAr,
    hotelNameEn: f.hotel.nameEn,
    city: f.hotel.city,
    sortOrder: f.sortOrder,
    curatedBy: f.curatedBy,
    createdAt: f.createdAt,
  }));

  return NextResponse.json({ featured: result });
}

export async function POST(req: NextRequest) {
  const session = await requirePlatformAdmin();
  if (session instanceof NextResponse) return session;

  const userId = session.userId;

  const body = await req.json();
  const parsed = createFeaturedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { hotelId, sortOrder } = parsed.data;

  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }
  if (hotel.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Hotel must be ACTIVE to be featured" },
      { status: 422 }
    );
  }

  try {
    const created = await prisma.featuredSelection.create({
      data: { hotelId, sortOrder, curatedBy: userId },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Hotel already featured" },
        { status: 409 }
      );
    }
    throw err;
  }
}
