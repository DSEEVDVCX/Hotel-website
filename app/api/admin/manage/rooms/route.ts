import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireHotelAdmin, validationError } from "@/lib/admin-auth";
import { parseNonNegativeInt } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const { roomTypeId, roomNumber, floor } = body;

  if (!roomTypeId || !roomNumber) {
    return NextResponse.json(
      { error: "roomTypeId and roomNumber are required" },
      { status: 422 }
    );
  }

  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeId },
    include: { hotel: true },
  });
  if (!roomType || roomType.hotel.ownerId !== session.userId) {
    return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  }

  try {
    const parsedFloor = floor !== undefined && floor !== null && floor !== ""
      ? parseNonNegativeInt(floor, "floor")
      : null;
    const room = await prisma.room.create({
      data: {
        roomTypeId,
        hotelId: roomType.hotelId,
        roomNumber: String(roomNumber),
        floor: parsedFloor,
      },
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
    const invalid = validationError(error);
    if (invalid) return invalid;
    const message = error instanceof Error ? error.message : "Failed to create room";
    if (message.includes("Unique constraint") || message.includes("P2002")) {
      return NextResponse.json(
        { error: "Room number already exists in this hotel" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(_req: NextRequest) {
  const session = await requireHotelAdmin();
  if (session instanceof NextResponse) return session;

  const hotel = await prisma.hotel.findFirst({ where: { ownerId: session.userId } });
  if (!hotel) {
    return NextResponse.json({ rooms: [] });
  }

  const rooms = await prisma.room.findMany({
    where: { hotelId: hotel.id },
    include: { roomType: true },
    orderBy: { roomNumber: "asc" },
  });

  return NextResponse.json({ rooms });
}
