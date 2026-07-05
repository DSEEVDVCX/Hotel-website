import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/session";
import { parseEnumParam } from "@/lib/validation";
import { UserRole } from "@prisma/client";

const userRoles = Object.values(UserRole);

export async function GET(req: NextRequest) {
  const session = await requirePlatformAdmin();
  if (session instanceof NextResponse) return session;

  const role = parseEnumParam(req.nextUrl.searchParams.get("role"), userRoles);
  if (role === null) {
    return NextResponse.json({ error: "Invalid user role" }, { status: 422 });
  }
  const users = await prisma.user.findMany({
    where: role ? { role } : {},
    select: { id: true, email: true, name: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
