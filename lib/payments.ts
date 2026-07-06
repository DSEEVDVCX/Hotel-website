import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-06-24.dahlia",
});

export async function createPaymentIntent(amount: number, currency: string = "sar"): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency,
    automatic_payment_methods: { enabled: true },
    capture_method: "manual",
  });
}

export async function capturePayment(
  paymentIntentId: string,
  idempotencyKey: string,
  expectedAmount: number,
  currency: string = "sar"
): Promise<Stripe.PaymentIntent> {
  if (!paymentIntentId.startsWith("pi_")) {
    throw new Error("Invalid payment intent id");
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const expectedMinorAmount = Math.round(expectedAmount * 100);
  if (paymentIntent.amount !== expectedMinorAmount || paymentIntent.currency !== currency.toLowerCase()) {
    throw new Error("Payment amount does not match booking total");
  }

  if (paymentIntent.status === "succeeded") {
    return paymentIntent;
  }

  if (paymentIntent.status !== "requires_capture") {
    throw new Error(`Payment intent is not ready to capture (${paymentIntent.status})`);
  }

  return stripe.paymentIntents.capture(
    paymentIntentId,
    {},
    { idempotencyKey: `capture_${idempotencyKey}` }
  );
}

export async function createRefund(
  paymentIntentId: string,
  amount: number,
  idempotencyKey: string
): Promise<Stripe.Refund> {
  return stripe.refunds.create(
    {
      payment_intent: paymentIntentId,
      amount: Math.round(amount * 100),
    },
    { idempotencyKey: `refund_${idempotencyKey}` }
  );
}

export async function cancelPaymentIntent(
  paymentIntentId: string,
  idempotencyKey: string
): Promise<Stripe.PaymentIntent | null> {
  if (!paymentIntentId.startsWith("pi_")) return null;

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (["canceled", "succeeded"].includes(paymentIntent.status)) {
    return paymentIntent;
  }

  if (!["requires_payment_method", "requires_confirmation", "requires_action", "processing", "requires_capture"].includes(paymentIntent.status)) {
    return paymentIntent;
  }

  return stripe.paymentIntents.cancel(paymentIntentId, undefined, {
    idempotencyKey: `cancel_${idempotencyKey}`,
  });
}

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  endpointSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    endpointSecret
  );
}
