"use client";

import { useLanguage } from "@/app/providers";

type PeriodSelectorProps = {
  startDate: string;
  endDate: string;
  onPeriodChange: (startDate: string, endDate: string) => void;
};

export function PeriodSelector({
  startDate,
  endDate,
  onPeriodChange,
}: PeriodSelectorProps) {
  const { t } = useLanguage();

  const handleStart = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    // Keep endDate valid: if the new start is after end, push end forward.
    const end = next > endDate ? next : endDate;
    onPeriodChange(next, end);
  };

  const handleEnd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    // Never allow end before start.
    const start = next < startDate ? next : startDate;
    onPeriodChange(start, next);
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="period-start" className="text-sm font-medium text-on-surface-muted">
          {t.dashboard.selectPeriod}
        </label>
        <input
          id="period-start"
          type="date"
          value={startDate}
          max={endDate}
          onChange={handleStart}
          className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="period-end" className="text-sm font-medium text-on-surface-muted">
          {t.dashboard.checkOut}
        </label>
        <input
          id="period-end"
          type="date"
          value={endDate}
          min={startDate}
          onChange={handleEnd}
          className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold"
        />
      </div>
    </div>
  );
}
