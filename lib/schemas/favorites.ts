import { z } from "zod";

export const createFavoriteSchema = z.object({
  hotelId: z.string().min(1),
});

export const favoriteHotelSchema = z.object({
  hotelId: z.string(),
  nameAr: z.string(),
  nameEn: z.string(),
  city: z.string(),
  startingPrice: z.number(),
  starRating: z.number(),
  avgRating: z.number().nullable().optional(),
  heroImage: z.string().nullable().optional(),
});

export const favoritesListSchema = z.object({
  favorites: z.array(favoriteHotelSchema),
});

export type CreateFavorite = z.infer<typeof createFavoriteSchema>;
export type FavoriteHotel = z.infer<typeof favoriteHotelSchema>;
export type FavoritesList = z.infer<typeof favoritesListSchema>;
