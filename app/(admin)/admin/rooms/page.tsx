"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import {
  Bed,
  Plus,
  Users as UsersIcon,
  Tag,
  ImageSquare,
  Check,
  Trash,
  X,
} from "@phosphor-icons/react";

type HotelOption = {
  id: string;
  nameAr: string;
  nameEn: string;
  city: string;
};

type RoomType = {
  id: string;
  nameAr: string;
  nameEn: string;
  capacity: number;
  bedType: string;
  basePrice: number;
  amenities: string[];
  photos: string[];
  _count: { rooms: number };
};

export default function AdminRoomsPage() {
  const { data: session } = useSession();
  const { locale, t } = useLanguage();
  const [hotels, setHotels] = useState<HotelOption[]>([]);
  const [hotelId, setHotelId] = useState("");
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<RoomType | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const role = (session?.user as { role?: string } | undefined)?.role;

  const loadHotels = useCallback(async () => {
    const res = await fetch("/api/admin/manage/hotels");
    const data = await res.json();
    const list = data.hotels || [];
    setHotels(list);
    if (list.length > 0 && !hotelId) setHotelId(list[0].id);
    setLoading(false);
  }, [hotelId]);

  const loadRoomTypes = useCallback(async () => {
    if (!hotelId) {
      setRoomTypes([]);
      return;
    }
    const res = await fetch(`/api/admin/manage/room-types?hotelId=${hotelId}`);
    const data = await res.json();
    setRoomTypes(data.roomTypes || []);
  }, [hotelId]);

  useEffect(() => {
    if (role !== "ADMIN") return;
    loadHotels();
  }, [role, loadHotels]);

  useEffect(() => {
    if (hotelId) loadRoomTypes();
  }, [hotelId, loadRoomTypes]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(
        `/api/admin/manage/room-types/${pendingDelete.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteError(
          res.status === 409
            ? t.admin.cannotDeleteBooked
            : data.error || "Failed to delete"
        );
        setDeleting(false);
        return;
      }
      setPendingDelete(null);
      await loadRoomTypes();
    } catch {
      setDeleteError("Network error");
    }
    setDeleting(false);
  };

  const currency = locale === "ar" ? "ر.س" : "SAR";

  if (role !== "ADMIN") return <EmptyState />;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Bed size={28} weight="light" className="text-gold-deep" aria-hidden />
          <h1 className="text-2xl font-bold text-on-surface font-display">{t.admin.roomsManagement}</h1>
        </div>
        {hotels.length > 0 && (
          <Button size="sm" onClick={() => { setShowForm(!showForm); setSaved(false); setError(""); }}>
            <Plus size={16} weight="light" aria-hidden />
            {t.admin.addRoomType}
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-on-surface-muted">...</p>
      ) : hotels.length === 0 ? (
        <EmptyState message={t.admin.noHotels} />
      ) : (
        <>
          {/* Hotel selector */}
          <div className="mb-6 flex items-center gap-2">
            <label htmlFor="hotel-select" className="text-sm font-medium text-on-surface-muted">
              {t.admin.selectHotel}:
            </label>
            <select
              id="hotel-select"
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              className="rounded-lg border border-border-strong bg-surface-raised px-3 py-2 text-sm text-on-surface outline-none focus:border-gold"
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {locale === "ar" ? h.nameAr : h.nameEn} — {h.city}
                </option>
              ))}
            </select>
          </div>

          {/* Add form */}
          {showForm && (
            <RoomTypeForm
              hotelId={hotelId}
              t={t}
              saving={saving}
              setSaving={setSaving}
              saved={saved}
              setSaved={setSaved}
              error={error}
              setError={setError}
              onSuccess={() => {
                loadRoomTypes();
                setShowForm(false);
              }}
            />
          )}

          {saved && !showForm && (
            <p className="mb-4 inline-flex items-center gap-1 text-sm text-success">
              <Check size={16} weight="light" aria-hidden />
              {t.admin.roomAdded}
            </p>
          )}

          {/* Existing room types */}
          <section className="mt-6">
            <h2 className="mb-4 font-display text-lg font-bold text-on-surface">{t.admin.existingRooms}</h2>
            {roomTypes.length === 0 ? (
              <EmptyState message={t.dashboard.noRooms} />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {roomTypes.map((rt) => (
                  <div key={rt.id} className="card overflow-hidden">
                    {rt.photos[0] && (
                      <div className="relative aspect-[16/9] w-full">
                        <Image
                        src={rt.photos[0]}
                        alt={locale === "ar" ? rt.nameAr : rt.nameEn}
                          fill
                          unoptimized
                          sizes="(min-width: 768px) 50vw, 100vw"
                          className="object-cover img-elegant"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-display font-bold text-on-surface">{locale === "ar" ? rt.nameAr : rt.nameEn}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-muted">
                        <span className="inline-flex items-center gap-1">
                          <UsersIcon size={13} weight="light" aria-hidden />
                          {rt.capacity}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Bed size={13} weight="light" aria-hidden />
                          {rt.bedType}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Tag size={13} weight="light" aria-hidden />
                          {Number(rt.basePrice)} {currency}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ImageSquare size={13} weight="light" aria-hidden />
                          {rt._count?.rooms ?? 0} {locale === "ar" ? "غرفة" : "rooms"}
                        </span>
                      </div>
                      {rt.amenities.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {rt.amenities.slice(0, 6).map((a, i) => (
                            <span key={i} className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-on-surface-muted">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-4 flex justify-end border-t border-border pt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPendingDelete(rt);
                            setDeleteError("");
                          }}
                        >
                          <Trash size={15} weight="light" aria-hidden />
                          {t.admin.delete}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <Modal
        open={pendingDelete !== null}
        onClose={() => {
          if (!deleting) setPendingDelete(null);
        }}
        title={pendingDelete ? (locale === "ar" ? pendingDelete.nameAr : pendingDelete.nameEn) : ""}
      >
        <p className="text-on-surface-muted">{t.admin.confirmDeleteRoom}</p>
        {deleteError && (
          <p className="mt-3 text-sm text-error" role="alert">
            {deleteError}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => setPendingDelete(null)}
            disabled={deleting}
          >
            {t.admin.cancel}
          </Button>
          <Button onClick={handleDelete} disabled={deleting}>
            {deleting ? t.admin.deleting : t.admin.delete}
          </Button>
        </div>
      </Modal>
    </main>
  );
}

function RoomTypeForm({
  hotelId,
  t,
  saving,
  setSaving,
  saved,
  setSaved,
  error,
  setError,
  onSuccess,
}: {
  hotelId: string;
  t: import("@/lib/content").Content;
  saving: boolean;
  setSaving: (v: boolean) => void;
  saved: boolean;
  setSaved: (v: boolean) => void;
  error: string;
  setError: (v: string) => void;
  onSuccess: () => void;
}) {
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [bedType, setBedType] = useState("king");
  const [basePrice, setBasePrice] = useState("");
  const [amenities, setAmenities] = useState("");
  const [photos, setPhotos] = useState<string[]>([""]);

  const updatePhoto = (index: number, value: string) =>
    setPhotos((prev) => prev.map((p, i) => (i === index ? value : p)));
  const addPhoto = () => setPhotos((prev) => [...prev, ""]);
  const removePhoto = (index: number) =>
    setPhotos((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/manage/room-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          nameAr,
          nameEn,
          descriptionAr: descAr.trim(),
          descriptionEn: descEn.trim(),
          capacity: Number(capacity),
          bedType,
          basePrice: Number(basePrice),
          amenities: amenities.split(",").map((a) => a.trim()).filter(Boolean),
          photos: photos.map((p) => p.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }

      setNameAr("");
      setNameEn("");
      setDescAr("");
      setDescEn("");
      setCapacity("2");
      setBedType("king");
      setBasePrice("");
      setAmenities("");
      setPhotos([""]);
      setSaved(true);
      onSuccess();
    } catch {
      setError("Network error");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card mb-6 space-y-4 p-6">
      <h3 className="font-display text-lg font-bold text-on-surface">{t.admin.addRoomType}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">{t.admin.roomNameAr}</label>
          <input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className="field" required dir="rtl" />
        </div>
        <div>
          <label className="field-label">{t.admin.roomNameEn}</label>
          <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} className="field" required dir="ltr" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">{t.admin.roomDescAr}</label>
          <textarea value={descAr} onChange={(e) => setDescAr(e.target.value)} className="field" rows={3} dir="rtl" />
        </div>
        <div>
          <label className="field-label">{t.admin.roomDescEn}</label>
          <textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} className="field" rows={3} dir="ltr" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label">{t.admin.capacity}</label>
          <input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="field" required style={{ fontVariantNumeric: "tabular-nums" }} />
        </div>
        <div>
          <label className="field-label">{t.admin.bedType}</label>
          <select value={bedType} onChange={(e) => setBedType(e.target.value)} className="field">
            <option value="king">King</option>
            <option value="queen">Queen</option>
            <option value="twin">Twin</option>
            <option value="double">Double</option>
            <option value="single">Single</option>
          </select>
        </div>
        <div>
          <label className="field-label">{t.admin.pricePerNight}</label>
          <input type="number" min="0" step="0.01" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} className="field" required style={{ fontVariantNumeric: "tabular-nums" }} />
        </div>
      </div>

      <div>
        <label className="field-label">{t.admin.amenities}</label>
        <input
          type="text"
          value={amenities}
          onChange={(e) => setAmenities(e.target.value)}
          placeholder="wifi, pool, spa, gym, tv, minibar"
          className="field"
        />
      </div>

      <div>
        <label className="field-label">{t.admin.photos}</label>
        <p className="mb-2 text-xs text-on-surface-muted">{t.admin.photosHint}</p>
        <div className="space-y-2">
          {photos.map((url, i) => (
            <div key={i} className="flex items-center gap-2">
              {url.trim() ? (
                <Image
                  src={url.trim()}
                  alt=""
                  width={64}
                  height={44}
                  unoptimized
                  className="h-11 w-16 flex-none rounded-md object-cover"
                  onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                  onLoad={(e) => { e.currentTarget.style.visibility = "visible"; }}
                />
              ) : (
                <div className="flex h-11 w-16 flex-none items-center justify-center rounded-md bg-surface-muted text-on-surface-subtle">
                  <ImageSquare size={16} weight="light" aria-hidden />
                </div>
              )}
              <input
                type="url"
                value={url}
                onChange={(e) => updatePhoto(i, e.target.value)}
                placeholder={t.admin.photoUrl}
                className="field flex-1"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="flex-none rounded-md p-2 text-on-surface-muted hover:text-error"
                aria-label={t.admin.delete}
              >
                <X size={16} weight="bold" aria-hidden />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPhoto}
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gold-deep hover:opacity-80"
        >
          <Plus size={15} weight="light" aria-hidden />
          {t.admin.addPhoto}
        </button>
      </div>

      {error && <p className="text-sm text-error" role="alert">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "..." : t.admin.save}
        </Button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-success">
            <Check size={16} weight="light" aria-hidden />
            {t.admin.roomAdded}
          </span>
        )}
      </div>
    </form>
  );
}
