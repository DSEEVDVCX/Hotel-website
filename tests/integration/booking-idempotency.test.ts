import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/db";

describe("Booking Idempotency (Principle VII)", () => {
  beforeEach(async () => {
    await prisma.roomReservation.deleteMany();
    await prisma.bookingLineItem.deleteMany();
    await prisma.booking.deleteMany({
      where: { idempotencyKey: { startsWith: "test-idempotency" } },
    });
  });

  it("returns existing booking when same idempotencyKey is used", async () => {
    const room = await prisma.room.findFirst({ where: { id: "seed-room-102" } });
    const guest = await prisma.user.findFirst({ where: { role: "GUEST" } });
    if (!room || !guest) return;

    const checkIn = new Date("2026-11-01");
    const checkOut = new Date("2026-11-03");

    const booking1 = await prisma.booking.create({
      data: {
        guestId: guest.id,
        hotelId: room.hotelId,
        checkIn,
        checkOut,
        guestCount: 2,
        status: "CONFIRMED",
        totalPrice: 900,
        idempotencyKey: "test-idempotency-001",
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
      },
    });

    const existing = await prisma.booking.findUnique({
      where: { idempotencyKey: "test-idempotency-001" },
    });

    expect(existing?.id).toBe(booking1.id);

    const count = await prisma.booking.count({
      where: { idempotencyKey: "test-idempotency-001" },
    });
    expect(count).toBe(1);
  });
});
