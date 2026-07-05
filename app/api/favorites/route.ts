import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getFavorites, addFavorite } from "@/lib/favorites";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "GUEST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const favorites = await getFavorites(userId);
  return NextResponse.json({ favorites });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "GUEST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
    await addFavorite(userId, hotelId);
    return NextResponse.json({ ok: true, hotelId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Already favorited" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to add favorite" }, { status: 500 });
  }
}
