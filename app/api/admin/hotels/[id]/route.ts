import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["approve", "suspend", "reinstate"]),
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

  const statusMap = { approve: "ACTIVE", suspend: "SUSPENDED", reinstate: "ACTIVE" } as const;
  const hotel = await prisma.hotel.findUnique({ where: { id } });
  if (!hotel) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (result.data.action === "approve" && hotel.status !== "PENDING") {
    return NextResponse.json({ error: "Hotel not pending" }, { status: 409 });
  }

  const updated = await prisma.hotel.update({
    where: { id },
    data: { status: statusMap[result.data.action] },
  });

  return NextResponse.json(updated);
}
