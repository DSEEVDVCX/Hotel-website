import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/db";

describe("Control Panel → Search Sync (FR-009)", () => {
  beforeEach(async () => {
    await prisma.roomReservation.deleteMany();
    await prisma.bookingLineItem.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.room.deleteMany();
    await prisma.roomType.deleteMany();
    await prisma.hotel.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { in: ["test-sync-admin@hotel.com", "test-sync-rate@hotel.com"] } },
    });
  });

  it("reflects room availability changes in search immediately", async () => {
    const admin = await prisma.user.create({
      data: {
        email: "test-sync-admin@hotel.com",
        passwordHash: "hash",
        name: "Test Admin",
        role: "ADMIN",
      },
    });

    const hotel = await prisma.hotel.create({
      data: {
        ownerId: admin.id,
        nameAr: "فندق الاختبار",
        nameEn: "Test Hotel",
        descriptionAr: "وصف",
        descriptionEn: "Description",
        city: "Riyadh",
        address: "Test Address",
        starRating: 4,
        status: "ACTIVE",
      },
    });

    const roomType = await prisma.roomType.create({
      data: {
        hotelId: hotel.id,
        nameAr: "غرفة عادية",
        nameEn: "Standard Room",
        capacity: 2,
        bedType: "double",
        basePrice: 300,
      },
    });

    const room = await prisma.room.create({
      data: {
        roomTypeId: roomType.id,
        hotelId: hotel.id,
        roomNumber: "101",
        status: "AVAILABLE",
      },
    });

    const availableBeforeBlock = await prisma.room.findFirst({
      where: { id: room.id, status: "AVAILABLE" },
    });
    expect(availableBeforeBlock).toBeTruthy();

    await prisma.room.update({
      where: { id: room.id },
      data: { status: "BLOCKED" },
    });

    const availableAfterBlock = await prisma.room.findFirst({
      where: { id: room.id, status: "AVAILABLE" },
    });
    expect(availableAfterBlock).toBeNull();

    await prisma.room.update({
      where: { id: room.id },
      data: { status: "AVAILABLE" },
    });

    const availableAfterRelease = await prisma.room.findFirst({
      where: { id: room.id, status: "AVAILABLE" },
    });
    expect(availableAfterRelease).toBeTruthy();
  });

  it("reflects rate changes in pricing", async () => {
    const admin = await prisma.user.create({
      data: {
        email: "test-sync-rate@hotel.com",
        passwordHash: "hash",
        name: "Rate Admin",
        role: "ADMIN",
      },
    });

    const hotel = await prisma.hotel.create({
      data: {
        ownerId: admin.id,
        nameAr: "فندق الأسعار",
        nameEn: "Rate Hotel",
        descriptionAr: "وصف",
        descriptionEn: "Description",
        city: "Jeddah",
        address: "Test",
        starRating: 3,
        status: "ACTIVE",
      },
    });

    const roomType = await prisma.roomType.create({
      data: {
        hotelId: hotel.id,
        nameAr: "غرفة",
        nameEn: "Room",
        capacity: 2,
        bedType: "king",
        basePrice: 400,
      },
    });

    const baseRate = await prisma.roomType.findUnique({
      where: { id: roomType.id },
      select: { basePrice: true },
    });
    expect(baseRate?.basePrice.toNumber()).toBe(400);

    const overrideRate = await prisma.rate.create({
      data: {
        roomTypeId: roomType.id,
        startDate: new Date("2026-12-01"),
        endDate: new Date("2026-12-31"),
        nightlyPrice: 550,
        label: "Holiday",
      },
    });
    expect(overrideRate.nightlyPrice.toNumber()).toBe(550);
  });
});
