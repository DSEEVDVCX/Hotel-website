import { z } from "zod";

function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export const bookingLineItemSchema = z.object({
  roomTypeId: z.string().min(1),
  quantity: z.number().int().min(1),
});

export const guestDetailsSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(5),
});

export const bookingQuoteSchema = z.object({
  hotelId: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestCount: z.number().int().min(1),
  lineItems: z.array(bookingLineItemSchema).min(1),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  { message: "checkOut must be after checkIn", path: ["checkOut"] }
).refine(
  (data) => dateOnly(data.checkIn) >= todayUtc(),
  { message: "checkIn must be today or later", path: ["checkIn"] }
).refine(
  (data) => data.lineItems.length === new Set(data.lineItems.map((item) => item.roomTypeId)).size,
  { message: "Duplicate room types are not allowed", path: ["lineItems"] }
);

export const createBookingSchema = bookingQuoteSchema.extend({
  idempotencyKey: z.string().uuid(),
  guestDetails: guestDetailsSchema,
  paymentIntentId: z.string().min(1),
});

export const cancelBookingSchema = z.object({});

export type CreateBooking = z.infer<typeof createBookingSchema>;
export type BookingQuote = z.infer<typeof bookingQuoteSchema>;
export type BookingLineItemInput = z.infer<typeof bookingLineItemSchema>;
