import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["suspend", "reinstate"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const result = actionSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 422 });
  }

  const status = result.data.action === "suspend" ? "SUSPENDED" : "ACTIVE";
  const updated = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, email: true, name: true, role: true, status: true },
  });

  return NextResponse.json(updated);
}
