"use client";

import { useLanguage } from "@/app/providers";

export function EmptyState({ message }: { message?: string }) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-on-surface-muted">{message || t.search.noResults}</p>
    </div>
  );
}
