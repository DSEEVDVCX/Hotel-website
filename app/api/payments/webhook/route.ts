import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments";

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

  const existingEvent = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Payment" WHERE "providerPaymentRef" = ${event.id} LIMIT 1
  `.catch(() => []);

  if (existingEvent && existingEvent.length > 0) {
    return NextResponse.json({ received: true, duplicate: true });
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
