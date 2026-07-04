import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cancelBooking } from "@/lib/bookings";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const { id } = await params;

  try {
    const result = await cancelBooking(id, userId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cancellation failed";
    if (message.includes("authorized")) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    if (message.includes("Cannot cancel")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
