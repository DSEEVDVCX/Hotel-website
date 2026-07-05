import { NextRequest, NextResponse } from "next/server";
import { getRoomTypeById } from "@/lib/room-types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const roomType = await getRoomTypeById(id);

  if (!roomType) {
    return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  }

  return NextResponse.json(roomType);
}
