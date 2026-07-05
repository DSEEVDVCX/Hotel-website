import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { UserRole } from "@prisma/client";

export type ActiveSession = {
  userId: string;
  role: UserRole;
  isPlatformAdmin: boolean;
};

export async function getActiveSession(): Promise<ActiveSession | NextResponse> {
  const session = await auth();
  const user = session?.user as { id?: string; role?: UserRole } | undefined;
  if (!user?.id || !user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true, status: true, isPlatformAdmin: true },
  });

  if (!dbUser || dbUser.status === "SUSPENDED") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { userId: dbUser.id, role: dbUser.role, isPlatformAdmin: dbUser.isPlatformAdmin };
}

export async function requireRole(role: UserRole): Promise<ActiveSession | NextResponse> {
  const session = await getActiveSession();
  if (session instanceof NextResponse) return session;
  if (session.role !== role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}

export async function requirePlatformAdmin(): Promise<ActiveSession | NextResponse> {
  const session = await requireRole("ADMIN");
  if (session instanceof NextResponse) return session;
  if (!session.isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return session;
}
