import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const status = req.nextUrl.searchParams.get("status");
  const hotels = await prisma.hotel.findMany({
    where: status ? { status: status as never } : {},
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
