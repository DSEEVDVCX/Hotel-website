import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getFavorites, addFavorite } from "@/lib/favorites";

export async function GET() {
  const session = await requireRole("GUEST");
  if (session instanceof NextResponse) return session;

  const favorites = await getFavorites(session.userId);
  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const session = await requireRole("GUEST");
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const { hotelId } = body;

  if (!hotelId) {
    return NextResponse.json({ error: "hotelId is required" }, { status: 422 });
  }

  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  try {
    await addFavorite(session.userId, hotelId);
    return NextResponse.json({ ok: true, hotelId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Already favorited" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}
