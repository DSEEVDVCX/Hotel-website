"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/app/providers";
import { AuthNav } from "@/components/auth/AuthNav";
import { EmptyState } from "@/components/ui/EmptyState";

export default function HotelierDashboard() {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (role !== "HOTELIER") return;
    fetch("/api/hotelier/bookings")
      .then((res) => res.json())
      .then((data) => {
        setBookings(data.bookings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [role]);

  if (role !== "HOTELIER") return <EmptyState />;

  return (
    <>
      <AuthNav role="HOTELIER" />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">{t.dashboard.title}</h1>
        <h2 className="mb-4 text-lg font-semibold">{t.dashboard.bookings}</h2>
        {loading ? (
          <p className="text-[var(--color-text-muted)]">...</p>
        ) : bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-4">
                <div>
                  <p className="font-medium">{b.guest?.name}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-semibold">{b.status}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
