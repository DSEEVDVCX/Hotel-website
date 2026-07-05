"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/providers";
import { EmptyState } from "@/components/ui/EmptyState";

type KPI = {
  occupancyRate: number;
  adr: number;
  revpar: number;
  bookingsCount: number;
  revenue: number;
  cancellations: number;
};

type RecentBooking = {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalPrice: number;
};

type DashboardResponse = {
  kpi: KPI;
  recentBookings: RecentBooking[];
  upcomingArrivals: RecentBooking[];
  upcomingDepartures: RecentBooking[];
};

type DashboardOverviewProps = {
  hotelId: string;
  startDate: string;
  endDate: string;
};

const CURRENCY = "SAR";

function formatNumber(value: number): string {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card shadow-soft p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-on-surface-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl text-on-surface">{value}</p>
    </div>
  );
}

function BookingRow({ booking }: { booking: RecentBooking }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-b-0">
      <div>
        <p className="font-medium text-on-surface">{booking.guestName || "—"}</p>
        <p className="text-xs text-on-surface-muted">
          {booking.checkIn} → {booking.checkOut}
        </p>
      </div>
      <div className="text-end">
        <span className="text-sm font-semibold text-gold-deep">
          {formatNumber(booking.totalPrice)} {CURRENCY}
        </span>
        <p className="text-xs text-on-surface-muted">{booking.status}</p>
      </div>
    </div>
  );
}

function BookingList({
  title,
  bookings,
  emptyKey,
}: {
  title: string;
  bookings: RecentBooking[];
  emptyKey: string;
}) {
  const { t } = useLanguage();
  return (
    <section className="card shadow-soft p-5">
      <h3 className="mb-2 font-display text-lg text-on-surface">{title}</h3>
      {bookings.length === 0 ? (
        <EmptyState message={t.dashboard[emptyKey as keyof typeof t.dashboard]} />
      ) : (
        <div>
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} />
          ))}
        </div>
      )}
    </section>
  );
}

export function DashboardOverview({
  hotelId,
  startDate,
  endDate,
}: DashboardOverviewProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!hotelId || !startDate || !endDate) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    const url = `/api/admin/manage/dashboard?hotelId=${encodeURIComponent(
      hotelId
    )}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(
      endDate
    )}`;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json() as Promise<DashboardResponse>;
      })
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [hotelId, startDate, endDate]);

  if (loading) {
    return (
      <p className="py-12 text-center text-on-surface-muted">…</p>
    );
  }

  if (error || !data) {
    return <EmptyState />;
  }

  const kpi = data.kpi;
  const cards: { label: string; value: string }[] = [
    { label: t.dashboard.occupancyRate, value: `${kpi.occupancyRate.toFixed(1)}%` },
    { label: t.dashboard.adr, value: `${formatNumber(kpi.adr)} ${CURRENCY}` },
    { label: t.dashboard.revpar, value: `${formatNumber(kpi.revpar)} ${CURRENCY}` },
    { label: t.dashboard.bookings, value: formatNumber(kpi.bookingsCount) },
    { label: t.dashboard.revenue, value: `${formatNumber(kpi.revenue)} ${CURRENCY}` },
    { label: t.dashboard.cancellations, value: formatNumber(kpi.cancellations) },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <KpiCard key={c.label} label={c.label} value={c.value} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <BookingList
          title={t.dashboard.recentBookings}
          bookings={data.recentBookings}
          emptyKey="noBookings"
        />
        <BookingList
          title={t.dashboard.upcomingArrivals}
          bookings={data.upcomingArrivals}
          emptyKey="noBookings"
        />
        <BookingList
          title={t.dashboard.upcomingDepartures}
          bookings={data.upcomingDepartures}
          emptyKey="noBookings"
        />
      </div>
    </div>
  );
}
