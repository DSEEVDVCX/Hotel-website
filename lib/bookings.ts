import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { calculateStayPricing } from "@/lib/pricing";
import { capturePayment } from "@/lib/payments";

const blockingBookingStatuses = ["PENDING", "CONFIRMED", "CHECKED_IN"] as const;

export async function createBooking(
  data: {
    guestId: string;
    hotelId: string;
    checkIn: Date;
    checkOut: Date;
    guestCount: number;
    idempotencyKey: string;
    lineItems: Array<{ roomTypeId: string; quantity: number }>;
    paymentIntentId: string;
  }
) {
  const existing = await prisma.booking.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
    include: { lineItems: true, payment: true },
  });
  if (existing) {
    return { booking: existing, created: false };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.hotel.findUniqueOrThrow({
        where: { id: data.hotelId, status: "ACTIVE" },
      });

      let totalPrice = 0;
      let totalCapacity = 0;
      const lineItemData: Array<{
        roomTypeId: string;
        quantity: number;
        unitPricePerNight: number;
        lineTotal: number;
        reservations: Array<{ roomId: string }>;
      }> = [];

      for (const item of data.lineItems) {
        const roomType = await tx.roomType.findFirstOrThrow({
          where: { id: item.roomTypeId, hotelId: data.hotelId },
          include: {
            rates: {
              where: {
                startDate: { lte: data.checkOut },
                endDate: { gte: data.checkIn },
              },
            },
            rooms: {
              where: {
                status: "AVAILABLE",
                hotelId: data.hotelId,
                reservations: {
                  none: {
                    AND: [
                      { checkIn: { lt: data.checkOut } },
                      { checkOut: { gt: data.checkIn } },
                      { bookingLineItem: { booking: { status: { in: [...blockingBookingStatuses] } } } },
                    ],
                  },
                },
              },
            },
          },
        });

        if (roomType.rooms.length < item.quantity) {
          throw new Error(`Only ${roomType.rooms.length} rooms available for ${roomType.nameEn}`);
        }

        const pricing = calculateStayPricing(roomType, data.checkIn, data.checkOut, item.quantity);
        totalPrice += pricing.totalForBooking;
        totalCapacity += roomType.capacity * item.quantity;

        const selectedRooms = roomType.rooms.slice(0, item.quantity);

        lineItemData.push({
          roomTypeId: item.roomTypeId,
          quantity: item.quantity,
          unitPricePerNight: pricing.totalPerRoom / pricing.nights,
          lineTotal: pricing.totalPerRoom * item.quantity,
          reservations: selectedRooms.map((r) => ({ roomId: r.id })),
        });
      }

      if (data.guestCount > totalCapacity) {
        throw new Error("Guest count exceeds selected room capacity");
      }

      const booking = await tx.booking.create({
        data: {
          guestId: data.guestId,
          hotelId: data.hotelId,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
          guestCount: data.guestCount,
          status: "PENDING",
          totalPrice,
          idempotencyKey: data.idempotencyKey,
          lineItems: {
            create: lineItemData.map((item) => ({
              roomTypeId: item.roomTypeId,
              quantity: item.quantity,
              unitPricePerNight: item.unitPricePerNight,
              lineTotal: item.lineTotal,
              reservations: {
                create: item.reservations.map((r) => ({
                  roomId: r.roomId,
                  checkIn: data.checkIn,
                  checkOut: data.checkOut,
                })),
              },
            })),
          },
        },
        include: { lineItems: { include: { reservations: true } } },
      });

      await tx.payment.create({
        data: {
          bookingId: booking.id,
          amount: totalPrice,
          currency: "SAR",
          status: "PENDING",
        },
      });

      return booking;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000,
    });

    try {
      const paymentResult = await capturePayment(data.paymentIntentId, data.idempotencyKey, Number(result.totalPrice));

      const updated = await prisma.$transaction(async (tx) => {
        const updatedBooking = await tx.booking.update({
          where: { id: result.id },
          data: { status: "CONFIRMED" },
          include: { lineItems: { include: { reservations: true } }, payment: true },
        });

        await tx.payment.update({
          where: { bookingId: result.id },
          data: {
            status: "CAPTURED",
            providerPaymentRef: paymentResult.id,
            capturedAt: new Date(),
          },
        });

        return updatedBooking;
      });

      return { booking: updated, created: true };
    } catch (paymentError) {
      await prisma.$transaction(async (tx) => {
        await tx.roomReservation.deleteMany({
          where: { bookingLineItem: { bookingId: result.id } },
        });
        await tx.booking.update({
          where: { id: result.id },
          data: { status: "FAILED" },
        });
        await tx.payment.update({
          where: { bookingId: result.id },
          data: {
            status: "FAILED",
            failureReason: paymentError instanceof Error ? paymentError.message : "Payment failed",
          },
        });
      });
      throw new Error("Payment capture failed");
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        throw new Error("Booking conflict — room may have been booked by another guest");
      }
    }
    throw error;
  }
}

export async function cancelBooking(
  bookingId: string,
  guestId: string
): Promise<{ bookingId: string; status: string; refundAmount: number | null }> {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { hotel: true, payment: true, lineItems: { include: { reservations: true } } },
  });

  if (booking.guestId !== guestId) {
    throw new Error("Not authorized to cancel this booking");
  }

  if (booking.status !== "CONFIRMED" && booking.status !== "CHECKED_IN") {
    throw new Error(`Cannot cancel booking with status ${booking.status}`);
  }

  const checkInTime = new Date(booking.checkIn);
  const hoursUntilCheckIn = (checkInTime.getTime() - Date.now()) / (1000 * 60 * 60);
  const isWithinFreeWindow = hoursUntilCheckIn >= booking.hotel.cancellationPolicyHours;

  let refundAmount: number | null = null;
  if (isWithinFreeWindow && booking.payment?.status === "CAPTURED" && booking.payment.providerPaymentRef) {
    refundAmount = booking.payment.amount.toNumber();
    const { createRefund } = await import("@/lib/payments");
    await createRefund(
      booking.payment.providerPaymentRef,
      refundAmount,
      `cancel_${booking.id}`
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const updatedBooking = await tx.booking.update({
      where: { id: bookingId },
      data: { status: "CANCELLED" },
    });

    for (const lineItem of booking.lineItems) {
      await tx.roomReservation.deleteMany({
        where: { bookingLineItemId: lineItem.id },
      });
    }

    if (booking.payment && refundAmount !== null) {
      await tx.payment.update({
        where: { bookingId },
        data: {
          status: "REFUNDED",
          refundedAt: new Date(),
          refundAmount,
        },
      });
    }

    return updatedBooking;
  });

  return {
    bookingId: updated.id,
    status: updated.status,
    refundAmount,
  };
}
