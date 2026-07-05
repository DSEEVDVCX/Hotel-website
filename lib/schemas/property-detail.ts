import { z } from "zod";

export const galleryImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  captionAr: z.string().nullable().optional(),
  captionEn: z.string().nullable().optional(),
  sortOrder: z.number(),
});

export const roomTypeDetailSchema = z.object({
  id: z.string(),
  nameAr: z.string(),
  nameEn: z.string(),
  capacity: z.number(),
  bedType: z.string(),
  basePrice: z.number(),
  effectivePrice: z.number().optional(),
  available: z.boolean(),
  gallery: z.array(galleryImageSchema),
});

export const reviewDetailSchema = z.object({
  rating: z.number(),
  commentAr: z.string().nullable().optional(),
  commentEn: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const hostInfoSchema = z.object({
  name: z.string(),
  joinedAt: z.string().optional(),
});

export const propertyDetailSchema = z.object({
  hotel: z.object({
    id: z.string(),
    nameAr: z.string(),
    nameEn: z.string(),
    descriptionAr: z.string(),
    descriptionEn: z.string(),
    city: z.string(),
    address: z.string(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    starRating: z.number(),
    amenities: z.array(z.string()),
    checkInTime: z.string(),
    checkOutTime: z.string(),
    cancellationPolicyHours: z.number(),
  }),
  gallery: z.array(galleryImageSchema),
  roomTypes: z.array(roomTypeDetailSchema),
  avgRating: z.number().nullable().optional(),
  reviewCount: z.number(),
  reviews: z.array(reviewDetailSchema),
  host: hostInfoSchema.optional(),
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;
export type RoomTypeDetail = z.infer<typeof roomTypeDetailSchema>;
export type PropertyDetail = z.infer<typeof propertyDetailSchema>;
