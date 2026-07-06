-- Payments are now linked to the Stripe PaymentIntent before capture so
-- webhooks can repair interrupted booking confirmations.
UPDATE "Payment"
SET "providerPaymentRef" = NULL
WHERE "providerPaymentRef" = '';

-- Basic database guards for values that should never be zero/negative.
ALTER TABLE "RoomType"
  ADD CONSTRAINT "RoomType_capacity_positive" CHECK ("capacity" > 0),
  ADD CONSTRAINT "RoomType_basePrice_positive" CHECK ("basePrice" > 0);

ALTER TABLE "Rate"
  ADD CONSTRAINT "Rate_nightlyPrice_positive" CHECK ("nightlyPrice" > 0),
  ADD CONSTRAINT "Rate_valid_date_range" CHECK ("endDate" >= "startDate");

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_guestCount_positive" CHECK ("guestCount" > 0),
  ADD CONSTRAINT "Booking_totalPrice_positive" CHECK ("totalPrice" > 0),
  ADD CONSTRAINT "Booking_valid_date_range" CHECK ("checkOut" > "checkIn");

ALTER TABLE "BookingLineItem"
  ADD CONSTRAINT "BookingLineItem_quantity_positive" CHECK ("quantity" > 0),
  ADD CONSTRAINT "BookingLineItem_unitPrice_positive" CHECK ("unitPricePerNight" > 0),
  ADD CONSTRAINT "BookingLineItem_lineTotal_positive" CHECK ("lineTotal" > 0);
