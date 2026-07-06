import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole, type ActiveSession } from "@/lib/session";

export async function requireHotelAdmin(): Promise<ActiveSession | NextResponse> {
  return requireRole("ADMIN");
}

export async function requireOwnedHotel(
  hotelId: string,
  session: ActiveSession
): Promise<{ id: string; ownerId: string } | NextResponse> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { id: true, ownerId: true },
  });

  if (!hotel || hotel.ownerId !== session.userId) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  return hotel;
}

export function validationError(error: unknown): NextResponse | null {
  if (error instanceof Error && error.message.includes("must be")) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }
  return null;
}
