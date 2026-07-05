import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/session";
import { prisma } from "@/lib/db";
import { reorderFeaturedSchema } from "@/lib/schemas/featured";

export async function PUT(req: NextRequest) {
  const session = await requirePlatformAdmin();
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const parsed = reorderFeaturedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { orderedHotelIds } = parsed.data;

  await prisma.$transaction(
    orderedHotelIds.map((hotelId, index) =>
      prisma.featuredSelection.update({
        where: { hotelId },
        data: { sortOrder: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
