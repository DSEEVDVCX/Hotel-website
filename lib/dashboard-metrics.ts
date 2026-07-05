import { prisma } from "@/lib/db";
import type { KPI } from "@/lib/schemas/dashboard";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Booking statuses that count toward realized room revenue. "Confirmed+"
 * means the booking is past the pending stage and not cancelled/failed.
 */
const REVENUE_STATUSES = [
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "COMPLETED",
] as const;

type RecentBookingInput = {
  id: string;
  guest?: { name: string } | null;
  checkIn: Date;
  checkOut: Date;
  status: string;
  totalPrice: { toNumber(): number };
};

export type RecentBooking = {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
};

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toRecentBooking(b: RecentBookingInput): RecentBooking {
  return {
    id: b.id,
    guestName: b.guest?.name ?? "",
    checkIn: toISODate(b.checkIn),
    checkOut: toISODate(b.checkOut),
    status: b.status,
    totalPrice: b.totalPrice.toNumber(),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Compute the core KPIs for a hotel over a [startDate, endDate] period.
 *
 * - occupancyRate: (room-nights sold / available room-nights) × 100
 * - adr:           total room revenue / room-nights sold
 * - revpar:        total room revenue / available room-nights
 * - bookingsCount: count of Booking rows overlapping the period
 * - revenue:       sum of totalPrice for confirmed+ bookings overlapping the period
 * - cancellations: count of CANCELLED bookings overlapping the period
 *
 * Room-nights sold   = count of RoomReservation rows overlapping the period.
 * Available room-nights = Room count × nights in the period.
 */
export async function computeHotelKPIs(
  hotelId: string,
  startDate: string,
  endDate: string
): Promise<KPI> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
  const nights = Math.max(1, diffDays);

  const [
    roomCount,
    roomNightsSold,
    bookingsCount,
    revenueAgg,
    cancellations,
  ] = await Promise.all([
    prisma.room.count({ where: { hotelId } }),
    prisma.roomReservation.count({
      where: {
        room: { hotelId },
        AND: [{ checkIn: { lt: end } }, { checkOut: { gt: start } }],
      },
    }),
    prisma.booking.count({
      where: {
        hotelId,
        AND: [{ checkIn: { lt: end } }, { checkOut: { gt: start } }],
      },
    }),
    prisma.booking.aggregate({
      _sum: { totalPrice: true },
      where: {
        hotelId,
        status: { in: [...REVENUE_STATUSES] },
        AND: [{ checkIn: { lt: end } }, { checkOut: { gt: start } }],
      },
    }),
    prisma.booking.count({
      where: {
        hotelId,
        status: "CANCELLED",
        AND: [{ checkIn: { lt: end } }, { checkOut: { gt: start } }],
      },
    }),
  ]);

  const availableRoomNights = roomCount * nights;
  const revenueDecimal = revenueAgg._sum.totalPrice;
  const revenue = revenueDecimal ? revenueDecimal.toNumber() : 0;

  const occupancyRate =
    availableRoomNights > 0 ? (roomNightsSold / availableRoomNights) * 100 : 0;
  const adr = roomNightsSold > 0 ? revenue / roomNightsSold : 0;
  const revpar = availableRoomNights > 0 ? revenue / availableRoomNights : 0;

  return {
    occupancyRate: round2(occupancyRate),
    adr: round2(adr),
    revpar: round2(revpar),
    bookingsCount,
    revenue: round2(revenue),
    cancellations,
  };
}

/** Most recently created bookings for a hotel (default 5). */
export async function getRecentBookings(
  hotelId: string,
  limit = 5
): Promise<RecentBooking[]> {
  const bookings = await prisma.booking.findMany({
    where: { hotelId },
    include: { guest: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return bookings.map((b) => toRecentBooking(b as unknown as RecentBookingInput));
}

/** Upcoming arrivals: confirmed/pending bookings with checkIn >= today. */
export async function getUpcomingArrivals(
  hotelId: string,
  limit = 5
): Promise<RecentBooking[]> {
  const today = startOfToday();
  const bookings = await prisma.booking.findMany({
    where: {
      hotelId,
      status: { in: ["CONFIRMED", "PENDING"] },
      checkIn: { gte: today },
    },
    include: { guest: { select: { name: true } } },
    orderBy: { checkIn: "asc" },
    take: limit,
  });
  return bookings.map((b) => toRecentBooking(b as unknown as RecentBookingInput));
}

/** Upcoming departures: checked-in bookings with checkOut >= today. */
export async function getUpcomingDepartures(
  hotelId: string,
  limit = 5
): Promise<RecentBooking[]> {
  const today = startOfToday();
  const bookings = await prisma.booking.findMany({
    where: {
      hotelId,
      status: "CHECKED_IN",
      checkOut: { gte: today },
    },
    include: { guest: { select: { name: true } } },
    orderBy: { checkOut: "asc" },
    take: limit,
  });
  return bookings.map((b) => toRecentBooking(b as unknown as RecentBookingInput));
}

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}
