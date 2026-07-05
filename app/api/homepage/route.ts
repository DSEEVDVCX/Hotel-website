import { NextResponse } from "next/server";
import { getFeaturedProperties } from "@/lib/featured";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 6, 1), 20) : 6;

  const featured = await getFeaturedProperties(limit);

  return NextResponse.json({
    featured,
    totalCount: featured.length,
  });
}
