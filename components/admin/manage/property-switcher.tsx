"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/app/providers";

type HotelOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  city: string;
  status: string;
};

type PropertySwitcherProps = {
  /** Controlled value (hotelId). When omitted, the switcher syncs to the URL. */
  value?: string;
  /** Called when the user picks a property. Falls back to updating ?hotelId in the URL. */
  onChange?: (hotelId: string) => void;
};

export function PropertySwitcher({ value, onChange }: PropertySwitcherProps) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [loading, setLoading] = useState(true);

  // The current selection: explicit value prop, else the ?hotelId query param.
  const urlHotelId = searchParams.get("hotelId") ?? "";
  const current = value ?? urlHotelId;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/manage/hotels")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const list: HotelOption[] = data.hotels ?? [];
        setHotels(list);
        setLoading(false);

        // If nothing is selected yet and the admin owns at least one
        // property, default to the first one so the dashboard has context.
        if (!current && list.length > 0) {
          if (onChange) {
            onChange(list[0].id);
          } else {
            applyToUrl(router, searchParams, list[0].id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (onChange) {
      onChange(id);
    } else {
      applyToUrl(router, searchParams, id);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="property-switcher"
        className="text-sm font-medium text-on-surface-muted"
      >
        {t.dashboard.selectProperty}
      </label>
      <select
        id="property-switcher"
        value={current}
        onChange={handleSelect}
        disabled={loading}
        className="rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold disabled:opacity-60"
      >
        <option value="" disabled>
          {t.dashboard.selectProperty}
        </option>
        {hotels.map((h) => (
          <option key={h.id} value={h.id}>
            {locale === "ar" ? h.nameAr : h.nameEn} — {h.city}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Push a hotelId into the URL query string without a full reload. */
function applyToUrl(
  router: ReturnType<typeof useRouter>,
  searchParams: URLSearchParams,
  hotelId: string
) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("hotelId", hotelId);
  const path = window.location.pathname;
  router.replace(`${path}?${params.toString()}`);
}
