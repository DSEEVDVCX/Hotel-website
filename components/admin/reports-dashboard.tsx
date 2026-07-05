"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

type Kpi = {
  bookingCount: number;
  revenue: number;
  cancellationRate: number;
  disputeCount: number;
};

type HotelReport = {
  hotelId: string;
  hotelNameAr: string;
  hotelNameEn: string;
  bookingCount: number;
  revenue: number;
  cancellationRate: number;
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthAgoStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

export function ReportsDashboard() {
  const { locale, t } = useLanguage();
  const [startDate, setStartDate] = useState(monthAgoStr());
  const [endDate, setEndDate] = useState(todayStr());
  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [byHotel, setByHotel] = useState<HotelReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (start: string, end: string) => {
    setLoading(true);
    const res = await fetch(
      `/api/admin/reports?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`
    );
    const data = await res.json();
    setKpi(data.kpi ?? null);
    setByHotel(data.byHotel ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const name = (ar: string, en: string) => (locale === "ar" ? ar : en);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-on-surface">{t.admin.platformReports}</h2>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="report-start"
            className="text-sm font-medium text-on-surface"
          >
            {locale === "ar" ? "من" : "From"}
          </label>
          <input
            id="report-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-on-surface outline-none focus:border-gold"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="report-end" className="text-sm font-medium text-on-surface">
            {locale === "ar" ? "إلى" : "To"}
          </label>
          <input
            id="report-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-on-surface outline-none focus:border-gold"
          />
        </div>
        <Button onClick={() => load(startDate, endDate)}>
          {t.admin.reports}
        </Button>
      </div>

      {loading ? (
        <p className="text-on-surface-muted">...</p>
      ) : kpi ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard
              label={t.admin.totalBookings}
              value={String(kpi.bookingCount)}
            />
            <KpiCard
              label={t.admin.totalRevenue}
              value={`${kpi.revenue.toFixed(2)} SAR`}
            />
            <KpiCard
              label={t.admin.cancellationRate}
              value={`${(kpi.cancellationRate * 100).toFixed(1)}%`}
            />
            <KpiCard
              label={t.admin.disputeCount}
              value={String(kpi.disputeCount)}
            />
          </div>

          <section>
            <h3 className="mb-3 text-lg font-semibold text-on-surface">
              {t.admin.perHotel}
            </h3>
            {byHotel.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border text-on-surface-muted">
                      <th className="p-3 text-start font-semibold">
                        {t.admin.hotels}
                      </th>
                      <th className="p-3 text-end font-semibold">
                        {t.admin.totalBookings}
                      </th>
                      <th className="p-3 text-end font-semibold">
                        {t.admin.totalRevenue}
                      </th>
                      <th className="p-3 text-end font-semibold">
                        {t.admin.cancellationRate}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {byHotel.map((h) => (
                      <tr key={h.hotelId} className="border-b border-border">
                        <td className="p-3 font-medium text-on-surface">
                          {name(h.hotelNameAr, h.hotelNameEn)}
                        </td>
                        <td className="p-3 text-end text-on-surface">
                          {h.bookingCount}
                        </td>
                        <td className="p-3 text-end text-on-surface">
                          {h.revenue.toFixed(2)} SAR
                        </td>
                        <td className="p-3 text-end text-on-surface">
                          {(h.cancellationRate * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <p className="text-sm text-on-surface-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-gold-deep">{value}</p>
    </div>
  );
}
