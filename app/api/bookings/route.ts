import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createBooking } from "@/lib/bookings";
import { createBookingSchema } from "@/lib/schemas/booking";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
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
      guestId: userId,
      hotelId: result.data.hotelId,
      checkIn: new Date(result.data.checkIn),
      checkOut: new Date(result.data.checkOut),
      guestCount: result.data.guestCount,
      idempotencyKey: result.data.idempotencyKey,
      lineItems: result.data.lineItems,
      paymentMethodId: result.data.paymentMethodId,
    });

    return NextResponse.json(
      { ...booking, payment: booking.payment },
      { status: created ? 201 : 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking failed";
    if (message.includes("conflict") || message.includes("available")) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    if (message.includes("Payment")) {
      return NextResponse.json({ error: message }, { status: 402 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const status = req.nextUrl.searchParams.get("status");

  const bookings = await prisma.booking.findMany({
    where: {
      guestId: userId,
      ...(status ? { status: status as never } : {}),
    },
    include: {
      hotel: { select: { nameAr: true, nameEn: true, city: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings });
}
