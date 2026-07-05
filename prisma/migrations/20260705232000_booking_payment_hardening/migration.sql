-- Prevent duplicated owner payouts if concurrent check-out requests race.
WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "bookingId" ORDER BY "createdAt" ASC, "id" ASC) AS rn
  FROM "Payout"
)
DELETE FROM "Payout"
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS "Payout_bookingId_key" ON "Payout"("bookingId");

-- Durable Stripe webhook idempotency ledger. Payment.providerPaymentRef remains
-- the PaymentIntent id, so event ids need their own unique table.
CREATE TABLE IF NOT EXISTS "WebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'stripe',
  "eventType" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "WebhookEvent_provider_idx" ON "WebhookEvent"("provider");
CREATE INDEX IF NOT EXISTS "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");

-- Separate platform-wide administration from hotel-owner administration.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "isPlatformAdmin" = true WHERE "email" = 'admin@suweraldhahab.sa';
