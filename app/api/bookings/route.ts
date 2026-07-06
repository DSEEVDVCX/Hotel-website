import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSession } from "@/lib/session";
import { createBooking } from "@/lib/bookings";
import { cancelPaymentIntent } from "@/lib/payments";
import { createBookingSchema } from "@/lib/schemas/booking";
import { parseEnumParam } from "@/lib/validation";
import { BookingStatus } from "@prisma/client";

const bookingStatuses = Object.values(BookingStatus);

export async function POST(req: NextRequest) {
  const session = await getActiveSession();
  if (session instanceof NextResponse) return session;
  if (session.role !== "GUEST") {
    return NextResponse.json({ error: "Only guests can create bookings" }, { status: 403 });
  }
  const body = await req.json();

  const result = createBookingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 422 }
    );
  }

  try {
    const { booking, created } = await createBooking({
      guestId: session.userId,
      hotelId: result.data.hotelId,
      checkIn: new Date(result.data.checkIn),
      checkOut: new Date(result.data.checkOut),
      guestCount: result.data.guestCount,
      idempotencyKey: result.data.idempotencyKey,
      lineItems: result.data.lineItems,
      paymentIntentId: result.data.paymentIntentId,
    });

    return NextResponse.json(
      { ...booking, payment: booking.payment },
      { status: created ? 201 : 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed";
    if (message.includes("conflict") || message.includes("available")) {
      await cancelPaymentIntent(result.data.paymentIntentId, result.data.idempotencyKey).catch(() => null);
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (message.includes("capacity") || message.includes("Idempotency")) {
      await cancelPaymentIntent(result.data.paymentIntentId, result.data.idempotencyKey).catch(() => null);
      return NextResponse.json({ error: message }, { status: 422 });
    }
    if (message.includes("Payment")) {
      return NextResponse.json({ error: message }, { status: 402 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getActiveSession();
  if (session instanceof NextResponse) return session;
  const status = parseEnumParam(req.nextUrl.searchParams.get("status"), bookingStatuses);
  if (status === null) {
    return NextResponse.json({ error: "Invalid booking status" }, { status: 422 });
  }

  const bookings = await prisma.booking.findMany({
    where: {
      guestId: session.userId,
      ...(status ? { status } : {}),
    },
    include: {
      hotel: { select: { nameAr: true, nameEn: true, city: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}
