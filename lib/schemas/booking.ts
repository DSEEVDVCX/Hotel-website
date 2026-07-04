import { z } from "zod";

export const bookingLineItemSchema = z.object({
  roomTypeId: z.string().cuid(),
  quantity: z.number().int().min(1),
});

export const guestDetailsSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(5),
});

export const createBookingSchema = z.object({
  hotelId: z.string().cuid(),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guestCount: z.number().int().min(1),
  idempotencyKey: z.string().uuid(),
  lineItems: z.array(bookingLineItemSchema).min(1),
  guestDetails: guestDetailsSchema,
  paymentMethodId: z.string().min(1),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  { message: "checkOut must be after checkIn", path: ["checkOut"] }
);

export const cancelBookingSchema = z.object({});

export type CreateBooking = z.infer<typeof createBookingSchema>;
export type BookingLineItemInput = z.infer<typeof bookingLineItemSchema>;
