import { z } from "zod";

export const searchQuerySchema = z.object({
  city: z.string().min(1),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  guests: z.coerce.number().int().min(1),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  { message: "checkOut must be after checkIn", path: ["checkOut"] }
).refine(
  (data) => new Date(data.checkIn) >= new Date(new Date().toISOString().split("T")[0]),
  { message: "checkIn must be today or future", path: ["checkIn"] }
);

export type SearchQuery = z.infer<typeof searchQuerySchema>;
