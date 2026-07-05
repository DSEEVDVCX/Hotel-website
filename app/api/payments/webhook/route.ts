import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

  let event;
  try {
    event = verifyWebhookSignature(body, signature, endpointSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    await prisma.webhookEvent.create({
      data: { id: event.id, provider: "stripe", eventType: event.type },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    throw error;
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as { id: string };
      const payment = await prisma.payment.findFirst({
        where: { providerPaymentRef: paymentIntent.id },
      });

      if (payment && payment.status === "PENDING") {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "CAPTURED",
              capturedAt: new Date(),
            },
          });
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: "CONFIRMED" },
          });
        });
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as { id: string };
      const payment = await prisma.payment.findFirst({
        where: { providerPaymentRef: paymentIntent.id },
      });

      if (payment && payment.status === "PENDING") {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: "FAILED",
              failureReason: "Payment intent failed",
            },
          });
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: { status: "FAILED" },
          });
          await tx.roomReservation.deleteMany({
            where: { bookingLineItem: { bookingId: payment.bookingId } },
          });
        });
      }
      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as { payment_intent: string; amount_refunded: number };
      const payment = await prisma.payment.findFirst({
        where: { providerPaymentRef: charge.payment_intent },
      });

      if (payment && payment.status === "CAPTURED") {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "REFUNDED",
            refundedAt: new Date(),
            refundAmount: charge.amount_refunded / 100,
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
