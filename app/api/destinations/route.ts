import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isDatabaseConnectionError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P1001"
  );
}

export async function GET() {
  try {
    const hotels = await prisma.hotel.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        nameAr: true,
        nameEn: true,
        city: true,
      },
      orderBy: [{ city: "asc" }, { nameAr: "asc" }],
    });

    const destinations = hotels.map((hotel) => ({
      id: hotel.id,
      city: hotel.city,
      nameAr: hotel.nameAr,
      nameEn: hotel.nameEn,
      value: hotel.nameAr,
    }));

    return NextResponse.json({ destinations });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({ destinations: [] });
    }
    throw error;
  }
}
