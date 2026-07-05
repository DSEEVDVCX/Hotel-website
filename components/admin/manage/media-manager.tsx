"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useLanguage } from "@/app/providers";
import { EmptyState } from "@/components/ui/EmptyState";

type MediaAsset = {
  id: string;
  ownerType: "HOTEL" | "ROOM_TYPE";
  ownerId: string;
  url: string;
  sortOrder: number;
  captionAr: string | null;
  captionEn: string | null;
};

type MediaManagerProps = {
  ownerType: "HOTEL" | "ROOM_TYPE";
  ownerId: string;
};

export function MediaManager({ ownerType, ownerId }: MediaManagerProps) {
  const { t, locale } = useLanguage();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [url, setUrl] = useState("");
  const [captionAr, setCaptionAr] = useState("");
  const [captionEn, setCaptionEn] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const load = useCallback(() => {
    fetch(
      `/api/admin/manage/media?ownerType=${ownerType}&ownerId=${encodeURIComponent(
        ownerId
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        setAssets((data.assets as MediaAsset[]) ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [ownerType, ownerId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/manage/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerType,
          ownerId,
          url,
          captionAr: captionAr || undefined,
          captionEn: captionEn || undefined,
          sortOrder,
        }),
      });
      if (res.ok) {
        setUrl("");
        setCaptionAr("");
        setCaptionEn("");
        setSortOrder(0);
        load();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(t.dashboard.deleteImage + "?")) {
      return;
    }
    await fetch(`/api/admin/manage/media/${id}`, { method: "DELETE" });
    load();
  };

  const handleCaptionSave = async (
    id: string,
    field: "captionAr" | "captionEn",
    value: string
  ) => {
    await fetch(`/api/admin/manage/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    load();
  };

  const onDragStart = (index: number) => setDragIndex(index);
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  };
  const onDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const onDrop = async (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      onDragEnd();
      return;
    }
    const reordered = [...assets];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    setAssets(reordered);
    onDragEnd();

    const orderedIds = reordered.map((a) => a.id);
    await fetch("/api/admin/manage/media/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerType, ownerId, orderedIds }),
    });
    load();
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-on-surface outline-none transition-colors focus:border-gold focus:ring-1 focus:ring-gold";

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-xl text-on-surface">{t.dashboard.mediaManager}</h2>

      <form
        onSubmit={handleUpload}
        className="card shadow-soft flex flex-col gap-3 p-5"
      >
        <h3 className="font-display text-lg text-on-surface">{t.dashboard.uploadImage}</h3>
        <div className="flex flex-col gap-1">
          <label htmlFor="media-url" className="text-sm font-medium text-on-surface-muted">
            URL
          </label>
          <input
            id="media-url"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className={inputClass}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="media-caption-ar" className="text-sm font-medium text-on-surface-muted">
              {t.dashboard.captionAr}
            </label>
            <input
              id="media-caption-ar"
              type="text"
              value={captionAr}
              onChange={(e) => setCaptionAr(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="media-caption-en" className="text-sm font-medium text-on-surface-muted">
              {t.dashboard.captionEn}
            </label>
            <input
              id="media-caption-en"
              type="text"
              value={captionEn}
              onChange={(e) => setCaptionEn(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex w-32 flex-col gap-1">
            <label htmlFor="media-sort" className="text-sm font-medium text-on-surface-muted">
              {t.dashboard.reorder}
            </label>
            <input
              id="media-sort"
              type="number"
              min={0}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary rounded-full px-5 py-2 text-sm disabled:opacity-60"
          >
            {t.dashboard.uploadImage}
          </button>
        </div>
      </form>

      <div>
        <h3 className="mb-3 font-display text-lg text-on-surface">{t.dashboard.galleryTitle}</h3>
        {loading ? (
          <p className="text-on-surface-muted">…</p>
        ) : assets.length === 0 ? (
          <EmptyState message={t.dashboard.galleryTitle} />
        ) : (
          <ul className="flex flex-col gap-3">
            {assets.map((asset, index) => {
              const isDragging = dragIndex === index;
              const isOver = overIndex === index && dragIndex !== index;
              return (
                <li
                  key={asset.id}
                  draggable
                  onDragStart={() => onDragStart(index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDragEnd={onDragEnd}
                  onDrop={() => onDrop(index)}
                  className={[
                    "card shadow-soft flex flex-col gap-3 p-4 sm:flex-row sm:items-center",
                    isDragging ? "opacity-50" : "",
                    isOver ? "border-gold" : "",
                  ].join(" ")}
                >
                  <span
                    className="cursor-grab select-none px-2 text-on-surface-muted active:cursor-grabbing"
                    aria-label={t.dashboard.reorder}
                    title={t.dashboard.reorder}
                  >
                    ⠿
                  </span>
                  <Image
                    src={asset.url}
                    alt={locale === "ar" ? asset.captionAr ?? "" : asset.captionEn ?? ""}
                    width={96}
                    height={64}
                    unoptimized
                    className="h-16 w-24 rounded-lg border border-border object-cover"
                  />
                  <div className="grid flex-1 gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      defaultValue={asset.captionAr ?? ""}
                      onBlur={(e) =>
                        e.target.value !== (asset.captionAr ?? "") &&
                        handleCaptionSave(asset.id, "captionAr", e.target.value)
                      }
                      placeholder={t.dashboard.captionAr}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      defaultValue={asset.captionEn ?? ""}
                      onBlur={(e) =>
                        e.target.value !== (asset.captionEn ?? "") &&
                        handleCaptionSave(asset.id, "captionEn", e.target.value)
                      }
                      placeholder={t.dashboard.captionEn}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(asset.id)}
                    className="rounded-full border border-border px-3 py-1.5 text-sm text-error transition-colors hover:border-error"
                  >
                    {t.dashboard.deleteImage}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
