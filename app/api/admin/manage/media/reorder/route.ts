import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { reorderMediaSchema, type MediaOwner } from "@/lib/schemas/media";

async function resolveOwnerHotelId(
  ownerType: MediaOwner,
  ownerId: string
): Promise<string | null> {
  if (ownerType === "HOTEL") return ownerId;
  const roomType = await prisma.roomType.findUnique({
    where: { id: ownerId },
    select: { hotelId: true },
  });
  return roomType?.hotelId ?? null;
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = reorderMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid reorder payload" },
      { status: 422 }
    );
  }

  const { ownerType, ownerId, orderedIds } = parsed.data;

  // Ownership check on the owner entity.
  const hotelId = await resolveOwnerHotelId(ownerType, ownerId);
  if (!hotelId) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { ownerId: true },
  });
  if (!hotel || hotel.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Ensure every id in the payload actually belongs to this owner —
  // prevents reordering assets not owned by the hotel.
  const owned = await prisma.mediaAsset.findMany({
    where: { ownerType, ownerId },
    select: { id: true },
  });
  const ownedIds = new Set(owned.map((a) => a.id));
  for (const id of orderedIds) {
    if (!ownedIds.has(id)) {
      return NextResponse.json(
        { error: `Asset ${id} does not belong to this owner` },
        { status: 404 }
      );
    }
  }

  // Atomically persist the new sort order.
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.mediaAsset.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
