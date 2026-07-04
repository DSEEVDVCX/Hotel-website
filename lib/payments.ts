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
  });
}

export async function capturePayment(
  paymentIntentId: string,
  idempotencyKey: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.capture(paymentIntentId, {
    idempotencyKey: `capture_${idempotencyKey}`,
  } as Stripe.PaymentIntentCaptureParams);
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
