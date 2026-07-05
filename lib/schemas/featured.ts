import { z } from "zod";

export const createFeaturedSchema = z.object({
  hotelId: z.string().min(1),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateFeaturedSchema = z.object({
  sortOrder: z.number().int().min(0),
});

export const reorderFeaturedSchema = z.object({
  orderedHotelIds: z.array(z.string()).min(1),
});

export type CreateFeatured = z.infer<typeof createFeaturedSchema>;
export type UpdateFeatured = z.infer<typeof updateFeaturedSchema>;
export type ReorderFeatured = z.infer<typeof reorderFeaturedSchema>;
