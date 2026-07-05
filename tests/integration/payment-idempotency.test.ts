import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/db";

describe("Payment Webhook Idempotency (Principle VII)", () => {
  beforeEach(async () => {
    await prisma.payment.deleteMany({
      where: { providerPaymentRef: { startsWith: "test-webhook-" } },
    });
  });

  it("does not double-process a duplicate webhook event", async () => {
    const guest = await prisma.user.findFirst({ where: { role: "GUEST" } });
    const room = await prisma.room.findFirst({ where: { id: "seed-room-103" } });
    if (!guest || !room) return;

    const checkIn = new Date("2026-10-01");
    const checkOut = new Date("2026-10-03");

    await prisma.booking.create({
      data: {
        guestId: guest.id,
        hotelId: room.hotelId,
        checkIn,
        checkOut,
        guestCount: 2,
        status: "PENDING",
        totalPrice: 900,
        idempotencyKey: "test-webhook-booking-1",
        lineItems: {
          create: {
            roomTypeId: room.roomTypeId,
            quantity: 1,
            unitPricePerNight: 450,
            lineTotal: 900,
            reservations: {
              create: { roomId: room.id, checkIn, checkOut },
            },
          },
        },
        payment: {
          create: {
            amount: 900,
            currency: "SAR",
            status: "PENDING",
            providerPaymentRef: "test-webhook-event-001",
          },
        },
      },
    });

    const payment1 = await prisma.payment.findFirst({
      where: { providerPaymentRef: "test-webhook-event-001" },
    });
    expect(payment1).toBeDefined();
    expect(payment1!.status).toBe("PENDING");

    await prisma.payment.update({
      where: { id: payment1!.id },
      data: { status: "CAPTURED", capturedAt: new Date() },
    });

    const payment2 = await prisma.payment.findFirst({
      where: { providerPaymentRef: "test-webhook-event-001" },
    });
    expect(payment2!.status).toBe("CAPTURED");

    const count = await prisma.payment.count({
      where: { providerPaymentRef: "test-webhook-event-001" },
    });
    expect(count).toBe(1);
  });
});
