import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { createPaymentIntent } from "@/lib/payments";
import { bookingQuoteSchema } from "@/lib/schemas/booking";
import { calculateStayPricing } from "@/lib/pricing";

const blockingBookingStatuses = ["PENDING", "CONFIRMED", "CHECKED_IN"] as const;

export async function POST(req: NextRequest) {
  const session = await requireRole("GUEST");
  if (session instanceof NextResponse) return session;

  const body = await req.json();
  const result = bookingQuoteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 422 }
    );
  }

  const data = result.data;
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);

  const hotel = await prisma.hotel.findUnique({
    where: { id: data.hotelId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  let totalPrice = 0;
  let totalCapacity = 0;

  for (const item of data.lineItems) {
    const roomType = await prisma.roomType.findFirst({
      where: { id: item.roomTypeId, hotelId: data.hotelId },
      include: {
        rates: {
          where: {
            startDate: { lte: checkOut },
            endDate: { gte: checkIn },
          },
        },
        rooms: {
          where: {
            status: "AVAILABLE",
            reservations: {
              none: {
                AND: [
                  { checkIn: { lt: checkOut } },
                  { checkOut: { gt: checkIn } },
                  { bookingLineItem: { booking: { status: { in: [...blockingBookingStatuses] } } } },
                ],
              },
            },
          },
        },
      },
    });

    if (!roomType) {
      return NextResponse.json({ error: "Room type not found" }, { status: 404 });
    }

    if (roomType.rooms.length < item.quantity) {
      return NextResponse.json(
        { error: `Only ${roomType.rooms.length} rooms available for ${roomType.nameEn}` },
        { status: 409 }
      );
    }

    const pricing = calculateStayPricing(roomType, checkIn, checkOut, item.quantity);
    totalPrice += pricing.totalForBooking;
    totalCapacity += roomType.capacity * item.quantity;
  }

  if (data.guestCount > totalCapacity) {
    return NextResponse.json(
      { error: "Guest count exceeds selected room capacity" },
      { status: 422 }
    );
  }

  const paymentIntent = await createPaymentIntent(totalPrice, "sar");

  return NextResponse.json({
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amount: totalPrice,
    currency: "SAR",
  });
}
