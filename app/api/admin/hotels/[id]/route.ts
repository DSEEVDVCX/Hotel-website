import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePlatformAdmin } from "@/lib/session";
import { syncHotelToFirebase } from "@/lib/room-types";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["approve", "suspend", "reinstate"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requirePlatformAdmin();
  if (session instanceof NextResponse) return session;

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

  // A hotel status change flips public visibility of all its room types.
  // Re-denormalize to Firebase and refresh the ISR-cached public pages.
  await syncHotelToFirebase(id);
  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath("/search");

  return NextResponse.json(updated);
}
