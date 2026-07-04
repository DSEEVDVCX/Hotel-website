import { getEffectiveNightlyRate } from "@/lib/availability";

export interface PricingBreakdown {
  nightlyRates: Array<{ date: Date; rate: number }>;
  totalPerRoom: number;
  totalForBooking: number;
  nights: number;
}

export function calculateStayPricing(
  roomType: { basePrice: { toNumber: () => number }; rates: Array<{ nightlyPrice: { toNumber: () => number }; startDate: Date; endDate: Date }> },
  checkIn: Date,
  checkOut: Date,
  quantity: number
): PricingBreakdown {
  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  );

  const nightlyRates: Array<{ date: Date; rate: number }> = [];
  const currentDate = new Date(checkIn);

  for (let i = 0; i < nights; i++) {
    const rate = getEffectiveNightlyRate(roomType, currentDate);
    nightlyRates.push({ date: new Date(currentDate), rate });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const totalPerRoom = nightlyRates.reduce((sum, { rate }) => sum + rate, 0);
  const totalForBooking = totalPerRoom * quantity;

  return {
    nightlyRates,
    totalPerRoom,
    totalForBooking,
    nights,
  };
}

export function formatSAR(amount: number): string {
  return `${amount.toFixed(2)} SAR`;
}
