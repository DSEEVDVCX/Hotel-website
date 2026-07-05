import { z } from "zod";

export const dashboardQuerySchema = z.object({
  hotelId: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  { message: "endDate must be on or after startDate", path: ["endDate"] }
);

export const kpiSchema = z.object({
  occupancyRate: z.number(),
  adr: z.number(),
  revpar: z.number(),
  bookingsCount: z.number(),
  revenue: z.number(),
  cancellations: z.number(),
});

export const recentBookingSchema = z.object({
  id: z.string(),
  guestName: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  status: z.string(),
  totalPrice: z.number(),
});

export const dashboardResponseSchema = z.object({
  kpi: kpiSchema,
  recentBookings: z.array(recentBookingSchema),
  upcomingArrivals: z.array(recentBookingSchema),
  upcomingDepartures: z.array(recentBookingSchema),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
export type KPI = z.infer<typeof kpiSchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
