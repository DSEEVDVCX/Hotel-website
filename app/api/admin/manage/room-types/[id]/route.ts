import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireHotelAdmin, validationError } from "@/lib/admin-auth";
import { parsePositiveInt, parsePositiveNumber } from "@/lib/validation";
import { syncRoomTypeToFirebase, removeRoomTypeFromFirebase } from "@/lib/room-types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const body = await req.json();

  const roomType = await prisma.roomType.findUnique({
    where: { id },
    include: { hotel: true },
  });
  if (!roomType || roomType.hotel.ownerId !== session.userId) {
    return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  }

  let updateData: Record<string, unknown>;
  try {
    updateData = {};
    if (body.nameAr !== undefined) updateData.nameAr = body.nameAr;
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn;
    if (body.descriptionAr !== undefined) updateData.descriptionAr = body.descriptionAr;
    if (body.descriptionEn !== undefined) updateData.descriptionEn = body.descriptionEn;
    if (body.capacity !== undefined) updateData.capacity = parsePositiveInt(body.capacity, "capacity");
    if (body.bedType !== undefined) updateData.bedType = body.bedType;
    if (body.basePrice !== undefined) updateData.basePrice = parsePositiveNumber(body.basePrice, "basePrice");
    if (body.amenities !== undefined) updateData.amenities = body.amenities;
    if (body.photos !== undefined) updateData.photos = body.photos;
  } catch (error) {
    const invalid = validationError(error);
    if (invalid) return invalid;
    throw error;
  }

  const updated = await prisma.roomType.update({ where: { id }, data: updateData });

  // Refresh the ISR-cached public pages that render this room type.
  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath("/search");
  revalidatePath(`/rooms/${id}`);

  // Durable copy to Firebase (best-effort).
  await syncRoomTypeToFirebase(id);

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  const roomType = await prisma.roomType.findUnique({
    where: { id },
    include: {
      hotel: true,
      _count: { select: { bookingItems: true } },
    },
  });
  if (!roomType || roomType.hotel.ownerId !== session.userId) {
    return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  }

  // Block deletion when the type has any booking history, or when one of its
  // physical rooms still has a reservation — deleting would orphan booking
  // records. The admin must cancel/relocate those bookings first.
  const reservationCount = await prisma.roomReservation.count({
    where: { room: { roomTypeId: id } },
  });
  if (roomType._count.bookingItems > 0 || reservationCount > 0) {
    return NextResponse.json(
      { error: "This room type has bookings and cannot be deleted." },
      { status: 409 }
    );
  }

  // Rooms don't cascade from RoomType; delete them first. Rates cascade
  // automatically when the room type is removed.
  await prisma.$transaction([
    prisma.room.deleteMany({ where: { roomTypeId: id } }),
    prisma.roomType.delete({ where: { id } }),
  ]);

  // Remove it from the ISR-cached public pages immediately.
  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath("/search");
  revalidatePath(`/rooms/${id}`);

  // Remove the durable Firebase copy (best-effort).
  await removeRoomTypeFromFirebase(id);

  return NextResponse.json({ ok: true });
}
