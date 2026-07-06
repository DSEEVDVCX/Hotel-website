import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getActiveSession } from "@/lib/session";

export async function PATCH(req: NextRequest) {
  const session = await getActiveSession();
  if (session instanceof NextResponse) return session;
  const body = await req.json();

  const data: { name?: string; phoneNumber?: string } = {};
  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    data.name = body.name.trim();
  }
  if (typeof body.phoneNumber === "string") {
    data.phoneNumber = body.phoneNumber.trim() || null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 422 });
  }

  const updated = await prisma.user.update({
    where: { id: session.userId },
    data,
    select: { id: true, name: true, email: true, phoneNumber: true },
  });

  return NextResponse.json(updated);
}

export async function GET() {
  const session = await getActiveSession();
  if (session instanceof NextResponse) return session;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, phoneNumber: true, role: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}
