import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { removeFavorite } from "@/lib/favorites";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "GUEST") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { hotelId } = await params;

  try {
    await removeFavorite(userId, hotelId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
  }
}
