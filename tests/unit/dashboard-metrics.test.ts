import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    room: { count: vi.fn() },
    roomReservation: { count: vi.fn() },
    booking: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";
import { computeHotelKPIs } from "@/lib/dashboard-metrics";

type MockFn = ReturnType<typeof vi.fn>;

const mockPrisma = prisma as unknown as {
  room: { count: MockFn };
  roomReservation: { count: MockFn };
  booking: { count: MockFn; aggregate: MockFn; findMany: MockFn };
};

// 2026-01-01 → 2026-01-08 = 7 nights. With 10 rooms that is 70 available
// room-nights — the denominator for occupancy and RevPAR.
const START = "2026-01-01";
const END = "2026-01-08";
const HOTEL_ID = "hotel-1";

describe("computeHotelKPIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes occupancyRate, ADR and RevPAR from period data", async () => {
    mockPrisma.room.count.mockResolvedValue(10); // 10 rooms → 70 available room-nights
    mockPrisma.roomReservation.count.mockResolvedValue(35); // room-nights sold
    // booking.count is called twice: first bookingsCount, then cancellations.
    mockPrisma.booking.count.mockResolvedValueOnce(5); // bookingsCount
    mockPrisma.booking.count.mockResolvedValueOnce(1); // cancellations
    mockPrisma.booking.aggregate.mockResolvedValue({
      _sum: { totalPrice: { toNumber: () => 7000 } }, // revenue
    });

    const kpi = await computeHotelKPIs(HOTEL_ID, START, END);

    // occupancyRate = 35 / 70 * 100 = 50
    expect(kpi.occupancyRate).toBe(50);
    // ADR = revenue / room-nights sold = 7000 / 35 = 200
    expect(kpi.adr).toBe(200);
    // RevPAR = revenue / available room-nights = 7000 / 70 = 100
    expect(kpi.revpar).toBe(100);
    expect(kpi.bookingsCount).toBe(5);
    expect(kpi.revenue).toBe(7000);
    expect(kpi.cancellations).toBe(1);

    // Ownership-overlap filters must be applied to the room-night query.
    expect(mockPrisma.roomReservation.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          room: { hotelId: HOTEL_ID },
          AND: [
            { checkIn: { lt: new Date(END) } },
            { checkOut: { gt: new Date(START) } },
          ],
        },
      })
    );
  });

  it("returns zeros for the zero-bookings edge case (no division by zero)", async () => {
    mockPrisma.room.count.mockResolvedValue(10);
    mockPrisma.roomReservation.count.mockResolvedValue(0);
    mockPrisma.booking.count.mockResolvedValueOnce(0); // bookingsCount
    mockPrisma.booking.count.mockResolvedValueOnce(0); // cancellations
    mockPrisma.booking.aggregate.mockResolvedValue({
      _sum: { totalPrice: null }, // no revenue rows
    });

    const kpi = await computeHotelKPIs(HOTEL_ID, START, END);

    expect(kpi.occupancyRate).toBe(0);
    // ADR must not throw on zero room-nights sold.
    expect(kpi.adr).toBe(0);
    expect(kpi.revpar).toBe(0);
    expect(kpi.bookingsCount).toBe(0);
    expect(kpi.revenue).toBe(0);
    expect(kpi.cancellations).toBe(0);
  });

  it("handles zero rooms without dividing by zero", async () => {
    mockPrisma.room.count.mockResolvedValue(0);
    mockPrisma.roomReservation.count.mockResolvedValue(0);
    mockPrisma.booking.count.mockResolvedValueOnce(0);
    mockPrisma.booking.count.mockResolvedValueOnce(0);
    mockPrisma.booking.aggregate.mockResolvedValue({
      _sum: { totalPrice: null },
    });

    const kpi = await computeHotelKPIs(HOTEL_ID, START, END);

    expect(kpi.occupancyRate).toBe(0);
    expect(kpi.revpar).toBe(0);
    expect(kpi.adr).toBe(0);
  });
});
