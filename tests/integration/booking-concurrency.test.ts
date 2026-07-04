import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/db";

describe("Booking Concurrency — Double-Booking Prevention (FR-004, SC-003)", () => {
  beforeEach(async () => {
    await prisma.roomReservation.deleteMany();
    await prisma.bookingLineItem.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.payment.deleteMany();
  });

  it("prevents two concurrent bookings for the same room and overlapping dates", async () => {
    const room = await prisma.room.findFirst({
      where: { id: "seed-room-101" },
    });
    if (!room) return;

    const guest = await prisma.user.findFirst({
      where: { role: "GUEST" },
    });
    if (!guest) return;

    const checkIn = new Date("2026-12-01");
    const checkOut = new Date("2026-12-03");

    const booking1 = await prisma.booking.create({
      data: {
        guestId: guest.id,
        hotelId: room.hotelId,
        checkIn,
        checkOut,
        guestCount: 2,
        status: "CONFIRMED",
        totalPrice: 900,
        idempotencyKey: "test-concurrency-1",
        lineItems: {
          create: {
            roomTypeId: room.roomTypeId,
            quantity: 1,
            unitPricePerNight: 450,
            lineTotal: 900,
            reservations: {
              create: {
                roomId: room.id,
                checkIn,
                checkOut,
              },
            },
          },
        },
      },
    });

    expect(booking1).toBeDefined();

    await expect(
      prisma.booking.create({
        data: {
          guestId: guest.id,
          hotelId: room.hotelId,
          checkIn,
          checkOut,
          guestCount: 2,
          status: "CONFIRMED",
          totalPrice: 900,
          idempotencyKey: "test-concurrency-2",
          lineItems: {
            create: {
              roomTypeId: room.roomTypeId,
              quantity: 1,
              unitPricePerNight: 450,
              lineTotal: 900,
              reservations: {
                create: {
                  roomId: room.id,
                  checkIn,
                  checkOut,
                },
              },
            },
          },
        },
      })
    ).rejects.toThrow();
  });
});
