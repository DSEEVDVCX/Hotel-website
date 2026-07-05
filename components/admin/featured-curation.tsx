"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

type FeaturedItem = {
  id: string;
  hotelId: string;
  hotelNameAr: string;
  hotelNameEn: string;
  city: string;
  sortOrder: number;
  curatedBy: string;
  createdAt: string;
};

type HotelItem = {
  id: string;
  nameAr: string;
  nameEn: string;
  city: string;
  status: string;
  isFeatured: boolean;
  featuredSortOrder: number | null;
  owner?: { name: string } | null;
};

export function FeaturedCuration() {
  const { locale, t } = useLanguage();
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [featuredRes, hotelsRes] = await Promise.all([
      fetch("/api/admin/featured"),
      fetch("/api/admin/hotels"),
    ]);
    const featuredData = await featuredRes.json();
    const hotelsData = await hotelsRes.json();
    setFeatured(featuredData.featured || []);
    setHotels(hotelsData.hotels || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const name = (ar: string, en: string) => (locale === "ar" ? ar : en);

  const handleAdd = async (hotelId: string) => {
    setBusy(true);
    await fetch("/api/admin/featured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotelId, sortOrder: featured.length }),
    });
    await load();
    setBusy(false);
  };

  const handleRemove = async (hotelId: string) => {
    setBusy(true);
    await fetch(`/api/admin/featured/${hotelId}`, { method: "DELETE" });
    await load();
    setBusy(false);
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= featured.length) return;
    const reordered = [...featured];
    [reordered[index], reordered[newIndex]] = [
      reordered[newIndex],
      reordered[index],
    ];
    setFeatured(reordered);
    setBusy(true);
    await fetch("/api/admin/featured/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedHotelIds: reordered.map((f) => f.hotelId) }),
    });
    await load();
    setBusy(false);
  };

  const nonFeaturedActive = hotels.filter(
    (h) => h.status === "ACTIVE" && !h.isFeatured
  );

  if (loading) {
    return <p className="text-on-surface-muted">...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="mb-3 text-lg font-semibold text-on-surface">
          {t.admin.curateFeatured}
        </h3>
        {featured.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2">
            {featured.map((f, i) => (
              <div
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-raised p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold text-sm font-bold text-on-dark">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-on-surface">
                      {name(f.hotelNameAr, f.hotelNameEn)}
                    </p>
                    <p className="text-sm text-on-surface-muted">{f.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || i === 0}
                    onClick={() => handleMove(i, -1)}
                    aria-label={t.admin.reorderFeatured}
                  >
                    ↑
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy || i === featured.length - 1}
                    onClick={() => handleMove(i, 1)}
                    aria-label={t.admin.reorderFeatured}
                  >
                    ↓
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => handleRemove(f.hotelId)}
                  >
                    {t.admin.removeFeatured}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-on-surface">
          {t.admin.addFeatured}
        </h3>
        {nonFeaturedActive.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-2">
            {nonFeaturedActive.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-muted p-4"
              >
                <div>
                  <p className="font-medium text-on-surface">{name(h.nameAr, h.nameEn)}</p>
                  <p className="text-sm text-on-surface-muted">{h.city}</p>
                </div>
                <Button size="sm" disabled={busy} onClick={() => handleAdd(h.id)}>
                  {t.admin.addFeatured}
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
