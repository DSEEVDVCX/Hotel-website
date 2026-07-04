import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  const where = {
    createdAt: {
      ...(startDate ? { gte: new Date(startDate) } : {}),
      ...(endDate ? { lte: new Date(endDate) } : {}),
    },
  };

  const [bookings, completedBookings, cancelledBookings, payments, payouts] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.count({ where: { ...where, status: "COMPLETED" } }),
    prisma.booking.count({ where: { ...where, status: "CANCELLED" } }),
    prisma.payment.findMany({ where: { status: "CAPTURED" }, select: { amount: true } }),
    prisma.payout.findMany({ where: { status: "PAID" }, select: { amount: true } }),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount.toNumber(), 0);
  const totalPayouts = payouts.reduce((sum, p) => sum + p.amount.toNumber(), 0);
  const cancellationRate = bookings > 0 ? cancelledBookings / bookings : 0;
  const averageBookingValue = bookings > 0 ? totalRevenue / bookings : 0;

  const byHotel = await prisma.hotel.findMany({
    where: { bookings: { some: where } },
    include: {
      _count: { select: { bookings: true } },
      bookings: { where: { status: "CANCELLED" }, select: { id: true } },
    },
  });

  const hotelStats = byHotel.map((h) => ({
    hotelId: h.id,
    hotelNameAr: h.nameAr,
    hotelNameEn: h.nameEn,
    bookings: h._count.bookings,
    cancellations: h.bookings.length,
  }));

  return NextResponse.json({
    period: { startDate, endDate },
    metrics: {
      totalBookings: bookings,
      totalRevenue,
      currency: "SAR",
      cancellationRate: Math.round(cancellationRate * 100) / 100,
      averageBookingValue: Math.round(averageBookingValue * 100) / 100,
      completedStays: completedBookings,
      totalPayouts,
    },
    byHotel: hotelStats,
  });
}
