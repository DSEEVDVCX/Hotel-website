import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as { id: string }).id;
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "HOTELIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const roomType = await prisma.roomType.findUnique({
    where: { id },
    include: { hotel: true },
  });
  if (!roomType || roomType.hotel.hotelierId !== userId) {
    return NextResponse.json({ error: "Room type not found" }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (body.nameAr !== undefined) updateData.nameAr = body.nameAr;
  if (body.nameEn !== undefined) updateData.nameEn = body.nameEn;
  if (body.descriptionAr !== undefined) updateData.descriptionAr = body.descriptionAr;
  if (body.descriptionEn !== undefined) updateData.descriptionEn = body.descriptionEn;
  if (body.capacity !== undefined) updateData.capacity = Number(body.capacity);
  if (body.bedType !== undefined) updateData.bedType = body.bedType;
  if (body.basePrice !== undefined) updateData.basePrice = Number(body.basePrice);
  if (body.amenities !== undefined) updateData.amenities = body.amenities;
  if (body.photos !== undefined) updateData.photos = body.photos;

  const updated = await prisma.roomType.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}
