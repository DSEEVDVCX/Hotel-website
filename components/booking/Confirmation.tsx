"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";

interface ConfirmationProps {
  bookingId: string;
}

export function Confirmation({ bookingId }: ConfirmationProps) {
  const { t } = useLanguage();
  const router = useRouter();

  return (
    <div className="rounded-xl border border-green-500 bg-green-50 p-6 text-center dark:bg-green-950">
      <h1 className="text-xl font-bold text-green-700 dark:text-green-400">{t.booking.confirmation}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">
        {t.booking.bookingId}: {bookingId}
      </p>
      <Button className="mt-4" onClick={() => router.push("/bookings")}>
        {t.booking.myBookings}
      </Button>
    </div>
  );
}
