"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { EmptyState } from "@/components/ui/EmptyState";
import { PeriodSelector } from "@/components/admin/manage/period-selector";
import { DashboardOverview } from "@/components/admin/manage/dashboard-overview";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultRange(): { startDate: string; endDate: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { startDate: toISODate(start), endDate: toISODate(end) };
}

function DashboardContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const hotelId = searchParams.get("hotelId") ?? "";

  const initial = defaultRange();
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);

  const handlePeriodChange = (nextStart: string, nextEnd: string) => {
    setStartDate(nextStart);
    setEndDate(nextEnd);
  };

  useEffect(() => {
    if (startDate > endDate) setEndDate(startDate);
  }, [startDate, endDate]);

  return (
    <main>
      <h1 className="display-sm mb-8 font-display text-primary">{t.dashboard.overview}</h1>

      <div className="mb-6">
        <PeriodSelector startDate={startDate} endDate={endDate} onPeriodChange={handlePeriodChange} />
      </div>

      {hotelId ? (
        <DashboardOverview hotelId={hotelId} startDate={startDate} endDate={endDate} />
      ) : (
        <EmptyState message={t.dashboard.selectProperty} />
      )}
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-on-surface-muted">...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
