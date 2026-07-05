import { z } from "zod";

export const reportsQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: "endDate must be on or after startDate", path: ["endDate"] }
);

export const hotelReportSchema = z.object({
  hotelId: z.string(),
  hotelNameAr: z.string(),
  hotelNameEn: z.string(),
  bookingCount: z.number(),
  revenue: z.number(),
  cancellationRate: z.number(),
});

export const adminReportsResponseSchema = z.object({
  kpi: z.object({
    bookingCount: z.number(),
    revenue: z.number(),
    cancellationRate: z.number(),
    disputeCount: z.number(),
  }),
  byHotel: z.array(hotelReportSchema),
});

export type ReportsQuery = z.infer<typeof reportsQuerySchema>;
export type HotelReport = z.infer<typeof hotelReportSchema>;
export type AdminReportsResponse = z.infer<typeof adminReportsResponseSchema>;
