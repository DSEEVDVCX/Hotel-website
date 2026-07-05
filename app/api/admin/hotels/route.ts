import { NextRequest, NextResponse } from "next/server";
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
