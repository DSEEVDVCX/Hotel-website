import { NextRequest, NextResponse } from "next/server";
import { searchAvailableRooms } from "@/lib/availability";
import { searchQuerySchema } from "@/lib/schemas/search";

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());

  const result = searchQuerySchema.safeParse(params);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0].message },
      { status: 422 }
    );
  }

  const { city, checkIn, checkOut, guests, page, limit } = result.data;

  const searchResult = await searchAvailableRooms({
    city,
    checkIn: new Date(checkIn),
    checkOut: new Date(checkOut),
    guests,
    page,
    limit,
  });

  return NextResponse.json(searchResult);
}
