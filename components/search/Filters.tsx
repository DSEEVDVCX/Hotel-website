"use client";

import { useLanguage } from "@/app/providers";

export function Filters() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-wrap gap-3">
      <span className="text-sm text-[var(--color-text-muted)]">{t.search.title}</span>
    </div>
  );
}
