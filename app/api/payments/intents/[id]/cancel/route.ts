import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/session";
import { cancelPaymentIntent } from "@/lib/payments";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireRole("GUEST");
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  if (!id.startsWith("pi_")) {
    return NextResponse.json({ error: "Invalid payment intent id" }, { status: 422 });
  }

  const paymentIntent = await cancelPaymentIntent(id, `client_${session.userId}_${id}`);
  return NextResponse.json({ ok: true, status: paymentIntent?.status ?? null });
}
