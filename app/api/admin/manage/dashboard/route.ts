import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { dashboardQuerySchema } from "@/lib/schemas/dashboard";
import {
  computeHotelKPIs,
  getRecentBookings,
  getUpcomingArrivals,
  getUpcomingDepartures,
} from "@/lib/dashboard-metrics";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = dashboardQuerySchema.safeParse({
    hotelId: req.nextUrl.searchParams.get("hotelId") ?? "",
    startDate: req.nextUrl.searchParams.get("startDate") ?? "",
    endDate: req.nextUrl.searchParams.get("endDate") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid query parameters" },
      { status: 422 }
    );
  }

  const { hotelId, startDate, endDate } = parsed.data;

  // Ownership check
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { ownerId: true },
  });
  if (!hotel || hotel.ownerId !== userId) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  const [kpi, recentBookings, upcomingArrivals, upcomingDepartures] =
    await Promise.all([
      computeHotelKPIs(hotelId, startDate, endDate),
      getRecentBookings(hotelId, 5),
      getUpcomingArrivals(hotelId, 5),
      getUpcomingDepartures(hotelId, 5),
    ]);

  return NextResponse.json({
    kpi,
    recentBookings,
    upcomingArrivals,
    upcomingDepartures,
  });
}
