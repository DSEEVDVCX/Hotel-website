import { z } from "zod";

export const mediaOwnerSchema = z.enum(["HOTEL", "ROOM_TYPE"]);

export const createMediaAssetSchema = z.object({
  ownerType: mediaOwnerSchema,
  ownerId: z.string().min(1),
  url: z.string().url(),
  captionAr: z.string().optional(),
  captionEn: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateMediaAssetSchema = z.object({
  captionAr: z.string().optional(),
  captionEn: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const reorderMediaSchema = z.object({
  ownerType: mediaOwnerSchema,
  ownerId: z.string().min(1),
  orderedIds: z.array(z.string()).min(1),
});

export type CreateMediaAsset = z.infer<typeof createMediaAssetSchema>;
export type UpdateMediaAsset = z.infer<typeof updateMediaAssetSchema>;
export type ReorderMedia = z.infer<typeof reorderMediaSchema>;
export type MediaOwner = z.infer<typeof mediaOwnerSchema>;
