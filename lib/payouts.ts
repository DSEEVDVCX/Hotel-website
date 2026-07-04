import { prisma } from "@/lib/db";

const PLATFORM_FEE_RATE = 0.10;

export async function createPayoutForCompletedBooking(bookingId: string) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { hotel: true },
  });

  if (booking.status !== "COMPLETED") {
    throw new Error("Payouts can only be created for completed stays");
  }

  const existingPayout = await prisma.payout.findFirst({
    where: { bookingId },
  });
  if (existingPayout) return existingPayout;

  const totalAmount = booking.totalPrice.toNumber();
  const payoutAmount = totalAmount * (1 - PLATFORM_FEE_RATE);

  return prisma.payout.create({
    data: {
      hotelierId: booking.hotel.hotelierId,
      bookingId: booking.id,
      amount: payoutAmount,
      status: "AVAILABLE",
    },
  });
}

export async function processPayoutCycle(payoutCycle: string) {
  const availablePayouts = await prisma.payout.findMany({
    where: { status: "AVAILABLE" },
  });

  const results = [];
  for (const payout of availablePayouts) {
    const updated = await prisma.payout.update({
      where: { id: payout.id },
      data: {
        status: "PAID",
        payoutCycle,
        paidAt: new Date(),
      },
    });
    results.push(updated);
  }

  return { processed: results.length, payoutCycle };
}
