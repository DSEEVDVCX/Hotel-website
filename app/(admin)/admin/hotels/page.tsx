"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeaturedCuration } from "@/components/admin/featured-curation";
import { Plus } from "@phosphor-icons/react";

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

export default function AdminHotelsPage() {
  const { data: session } = useSession();
  const { locale, t } = useLanguage();
  const [hotels, setHotels] = useState<HotelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const role = (session?.user as { role?: string } | undefined)?.role;

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/hotels");
    const data = await res.json();
    setHotels(data.hotels || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (role !== "ADMIN") return;
    load();
  }, [role, load]);

  const handleAction = async (
    hotelId: string,
    action: "approve" | "suspend" | "reinstate"
  ) => {
    await fetch(`/api/admin/hotels/${hotelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await load();
  };

  if (role !== "ADMIN") return <EmptyState />;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="eyebrow">{t.admin.existingHotels}</span>
          <h1 className="mt-4 text-3xl font-bold text-on-surface font-display">
            {t.admin.hotels}
          </h1>
        </div>
        <Button onClick={() => { setShowForm((value) => !value); setSaved(false); setError(""); }}>
          <Plus size={16} weight="light" aria-hidden />
          {t.admin.addHotel}
        </Button>
      </div>

      {showForm && (
        <HotelForm
          t={t}
          saving={saving}
          setSaving={setSaving}
          setSaved={setSaved}
          error={error}
          setError={setError}
          onSuccess={async () => {
            setShowForm(false);
            await load();
          }}
        />
      )}

      {saved && !showForm && (
        <p className="mb-6 rounded-full bg-success/10 px-4 py-2 text-sm font-semibold text-success">
          {t.admin.hotelAdded}
        </p>
      )}

      <section className="mb-10 rounded-2xl border border-border bg-surface-muted p-5">
        <h2 className="mb-4 text-lg font-semibold text-on-surface">
          {t.admin.featured}
        </h2>
        <FeaturedCuration />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-on-surface">
          {t.admin.curateFeatured}
        </h2>
        {loading ? (
          <p className="text-on-surface-muted">...</p>
        ) : hotels.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {hotels.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-border bg-surface-raised p-4"
              >
                <div>
                  <p className="font-medium text-on-surface">
                    {locale === "ar" ? h.nameAr : h.nameEn}
                  </p>
                  <p className="text-sm text-on-surface-muted">
                    {h.owner?.name} · {h.status}
                    {h.isFeatured ? " · ★" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {h.status === "PENDING" && (
                    <Button size="sm" onClick={() => handleAction(h.id, "approve")}>
                      {t.admin.approve}
                    </Button>
                  )}
                  {h.status === "ACTIVE" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(h.id, "suspend")}
                    >
                      {t.admin.suspend}
                    </Button>
                  )}
                  {h.status === "SUSPENDED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(h.id, "reinstate")}
                    >
                      {t.admin.reinstate}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function HotelForm({
  t,
  saving,
  setSaving,
  setSaved,
  error,
  setError,
  onSuccess,
}: {
  t: import("@/lib/content").Content;
  saving: boolean;
  setSaving: (value: boolean) => void;
  setSaved: (value: boolean) => void;
  error: string;
  setError: (value: string) => void;
  onSuccess: () => Promise<void>;
}) {
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [starRating, setStarRating] = useState("5");
  const [amenities, setAmenities] = useState("");
  const [photos, setPhotos] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/admin/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameAr,
          nameEn,
          descriptionAr,
          descriptionEn,
          city,
          address,
          starRating: Number(starRating),
          amenities: amenities.split(",").map((item) => item.trim()).filter(Boolean),
          photos: photos.split(",").map((item) => item.trim()).filter(Boolean),
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Failed to create hotel");
        setSaving(false);
        return;
      }

      setNameAr("");
      setNameEn("");
      setDescriptionAr("");
      setDescriptionEn("");
      setCity("");
      setAddress("");
      setStarRating("5");
      setAmenities("");
      setPhotos("");
      setLatitude("");
      setLongitude("");
      setSaved(true);
      await onSuccess();
    } catch {
      setError("Network error");
    }

    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 rounded-[2rem] border border-gold/20 bg-surface-raised p-2 shadow-sm">
      <div className="rounded-[calc(2rem-0.5rem)] border border-border bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)]">
        <h2 className="mb-5 font-display text-2xl font-bold text-primary">{t.admin.addHotel}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block"><span className="field-label">{t.admin.hotelNameAr}</span><input className="field" value={nameAr} onChange={(e) => setNameAr(e.target.value)} required dir="rtl" /></label>
          <label className="block"><span className="field-label">{t.admin.hotelNameEn}</span><input className="field" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required dir="ltr" /></label>
          <label className="block md:col-span-2"><span className="field-label">{t.admin.hotelDescAr}</span><textarea className="field min-h-24" value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} required dir="rtl" /></label>
          <label className="block md:col-span-2"><span className="field-label">{t.admin.hotelDescEn}</span><textarea className="field min-h-24" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} required dir="ltr" /></label>
          <label className="block"><span className="field-label">{t.admin.city}</span><input className="field" value={city} onChange={(e) => setCity(e.target.value)} required /></label>
          <label className="block"><span className="field-label">{t.admin.address}</span><input className="field" value={address} onChange={(e) => setAddress(e.target.value)} required /></label>
          <label className="block"><span className="field-label">{t.admin.starRating}</span><input className="field" type="number" min="1" max="5" value={starRating} onChange={(e) => setStarRating(e.target.value)} required /></label>
          <label className="block"><span className="field-label">{t.admin.amenities}</span><input className="field" value={amenities} onChange={(e) => setAmenities(e.target.value)} placeholder="wifi, pool, spa" /></label>
          <label className="block md:col-span-2"><span className="field-label">{t.admin.photos}</span><input className="field" value={photos} onChange={(e) => setPhotos(e.target.value)} placeholder="https://... , https://..." /></label>
          <label className="block"><span className="field-label">{t.admin.latitude}</span><input className="field" type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} /></label>
          <label className="block"><span className="field-label">{t.admin.longitude}</span><input className="field" type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} /></label>
        </div>
        {error && <p className="mt-4 text-sm text-error" role="alert">{error}</p>}
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving}>{saving ? "..." : t.admin.save}</Button>
        </div>
      </div>
    </form>
  );
}
