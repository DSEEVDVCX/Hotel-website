import { NextRequest, NextResponse } from "next/server";
import { getHotelWithAvailability } from "@/lib/availability";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const { hotelId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  if (!checkIn || !checkOut) {
    return NextResponse.json(
      { error: "checkIn and checkOut are required" },
      { status: 422 }
    );
  }

  const hotel = await getHotelWithAvailability(
    hotelId,
    new Date(checkIn),
    new Date(checkOut)
  );

  if (!hotel) {
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
  }

  return NextResponse.json(hotel);
}
