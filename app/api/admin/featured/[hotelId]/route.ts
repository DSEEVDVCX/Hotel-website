import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateFeaturedSchema } from "@/lib/schemas/featured";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { hotelId } = await params;

  const body = await req.json();
  const parsed = updateFeaturedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const existing = await prisma.featuredSelection.findUnique({
    where: { hotelId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Featured selection not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.featuredSelection.update({
    where: { hotelId },
    data: { sortOrder: parsed.data.sortOrder },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { hotelId } = await params;

  const existing = await prisma.featuredSelection.findUnique({
    where: { hotelId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Featured selection not found" },
      { status: 404 }
    );
  }

  await prisma.featuredSelection.delete({ where: { hotelId } });

  return NextResponse.json({ ok: true });
}
