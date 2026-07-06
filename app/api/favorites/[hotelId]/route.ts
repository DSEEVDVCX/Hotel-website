import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { removeFavorite } from "@/lib/favorites";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const session = await requireRole("GUEST");
  if (session instanceof NextResponse) return session;

  const { hotelId } = await params;

  try {
    await removeFavorite(session.userId, hotelId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
  }
}
