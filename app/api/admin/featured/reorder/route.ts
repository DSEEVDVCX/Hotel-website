import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { reorderFeaturedSchema } from "@/lib/schemas/featured";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = reorderFeaturedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { orderedHotelIds } = parsed.data;

  await prisma.$transaction(
    orderedHotelIds.map((hotelId, index) =>
      prisma.featuredSelection.update({
        where: { hotelId },
        data: { sortOrder: index },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
