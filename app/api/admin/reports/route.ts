import { NextRequest, NextResponse } from "next/server";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { reportsQuerySchema } from "@/lib/schemas/admin-reports";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (startDate && endDate) {
    const parsed = reportsQuerySchema.safeParse({ startDate, endDate });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid date range", details: parsed.error.flatten() },
        { status: 422 }
      );
    }
    createdAt.gte = new Date(parsed.data.startDate);
    createdAt.lte = new Date(parsed.data.endDate);
  } else if (startDate) {
    createdAt.gte = new Date(startDate);
  } else if (endDate) {
    createdAt.lte = new Date(endDate);
  }

  const hasRange = Boolean(startDate) || Boolean(endDate);
  const where = hasRange ? { createdAt } : {};
  const revenueWhere = {
    ...where,
    status: { notIn: [BookingStatus.CANCELLED, BookingStatus.FAILED] },
  };

  const [
    bookingCount,
    cancelledCount,
    revenueAgg,
    allGroups,
    cancelledGroups,
    revenueGroups,
  ] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.count({ where: { ...where, status: "CANCELLED" } }),
    prisma.booking.aggregate({
      where: revenueWhere,
      _sum: { totalPrice: true },
    }),
    prisma.booking.groupBy({
      by: ["hotelId"],
      where,
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["hotelId"],
      where: { ...where, status: "CANCELLED" },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["hotelId"],
      where: revenueWhere,
      _sum: { totalPrice: true },
    }),
  ]);

  const revenue = revenueAgg._sum?.totalPrice
    ? revenueAgg._sum.totalPrice.toNumber()
    : 0;
  const cancellationRate =
    bookingCount > 0
      ? Math.round((cancelledCount / bookingCount) * 100) / 100
      : 0;
  const disputeCount = 0;

  const hotelIds = allGroups.map((g) => g.hotelId);
  const hotels =
    hotelIds.length > 0
      ? await prisma.hotel.findMany({
          where: { id: { in: hotelIds } },
          select: { id: true, nameAr: true, nameEn: true },
        })
      : [];

  const hotelMap = new Map(hotels.map((h) => [h.id, h]));
  const cancelledMap = new Map(
    cancelledGroups.map((g) => [g.hotelId, g._count._all])
  );
  const revenueMap = new Map(
    revenueGroups.map((g) => [
      g.hotelId,
      g._sum?.totalPrice ? g._sum.totalPrice.toNumber() : 0,
    ])
  );

  const byHotel = allGroups.map((g) => {
    const hotel = hotelMap.get(g.hotelId);
    const count = g._count._all;
    const cancelled = cancelledMap.get(g.hotelId) ?? 0;
    const hotelRevenue = revenueMap.get(g.hotelId) ?? 0;
    const hotelCancellationRate =
      count > 0 ? Math.round((cancelled / count) * 100) / 100 : 0;
    return {
      hotelId: g.hotelId,
      hotelNameAr: hotel?.nameAr ?? "",
      hotelNameEn: hotel?.nameEn ?? "",
      bookingCount: count,
      revenue: hotelRevenue,
      cancellationRate: hotelCancellationRate,
    };
  });

  return NextResponse.json({
    kpi: {
      bookingCount,
      revenue,
      cancellationRate,
      disputeCount,
    },
    byHotel,
  });
}
