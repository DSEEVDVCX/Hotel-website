import { z } from "zod";

export const featuredHotelSchema = z.object({
  hotelId: z.string(),
  nameAr: z.string(),
  nameEn: z.string(),
  city: z.string(),
  startingPrice: z.number(),
  currency: z.string().default("SAR"),
  starRating: z.number(),
  avgRating: z.number().nullable().optional(),
  reviewCount: z.number().default(0),
  heroImage: z.string().nullable().optional(),
  isCurated: z.boolean(),
});

export const homepageResponseSchema = z.object({
  featured: z.array(featuredHotelSchema),
  totalCount: z.number(),
});

export type FeaturedHotel = z.infer<typeof featuredHotelSchema>;
export type HomepageResponse = z.infer<typeof homepageResponseSchema>;
