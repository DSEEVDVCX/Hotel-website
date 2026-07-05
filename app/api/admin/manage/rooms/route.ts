import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
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
  if (!roomType || roomType.hotel.ownerId !== userId) {
    return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  }

  try {
    const room = await prisma.room.create({
      data: {
        roomTypeId,
        hotelId: roomType.hotelId,
        roomNumber: String(roomNumber),
        floor: floor !== undefined && floor !== null ? Number(floor) : null,
      },
    });
    return NextResponse.json(room, { status: 201 });
  } catch (error) {
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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hotel = await prisma.hotel.findFirst({ where: { ownerId: userId } });
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
