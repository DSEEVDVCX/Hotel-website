"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Heart } from "@phosphor-icons/react";
import { useLanguage } from "@/app/providers";

type FavoriteHotel = {
  hotelId: string;
  nameAr: string;
  nameEn: string;
  city: string;
  startingPrice: number;
  starRating: number;
  avgRating: number | null;
  heroImage: string | null;
};

export default function FavoritesList() {
  const { t, locale } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteHotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => {
        setFavorites(data.favorites || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleRemove = async (hotelId: string) => {
    await fetch(`/api/favorites/${hotelId}`, { method: "DELETE" });
    setFavorites((prev) => prev.filter((f) => f.hotelId !== hotelId));
  };

  if (loading) return <p className="text-on-surface-muted">...</p>;

  if (favorites.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface-muted p-8 text-center">
        <Heart size={32} className="mx-auto mb-3 text-on-surface-subtle" weight="light" aria-hidden />
        <p className="text-on-surface-muted">{t.guestAccount.noFavorites}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-bold text-on-surface">{t.guestAccount.favorites}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {favorites.map((fav) => (
          <div key={fav.hotelId} className="card overflow-hidden">
            {fav.heroImage && (
              <Link href={`/hotels/${fav.hotelId}`}>
                <div className="relative aspect-[4/3] w-full">
                  <Image
                  src={fav.heroImage}
                  alt={locale === "ar" ? fav.nameAr : fav.nameEn}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover img-elegant"
                  />
                </div>
              </Link>
            )}
            <div className="p-4">
              <Link href={`/hotels/${fav.hotelId}`}>
                <h3 className="font-display font-bold text-on-surface">{locale === "ar" ? fav.nameAr : fav.nameEn}</h3>
              </Link>
              <p className="mb-2 flex items-center gap-1 text-sm text-on-surface-muted">
                <MapPin size={12} weight="light" aria-hidden />
                {fav.city}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-gold">
                  {Array.from({ length: fav.starRating }).map((_, i) => (
                    <Star key={i} size={12} weight="fill" aria-hidden />
                  ))}
                  {fav.avgRating && (
                    <span className="text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>({fav.avgRating.toFixed(1)})</span>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(fav.hotelId)}
                  className="text-sm text-on-surface-muted transition-colors hover:text-error"
                >
                  {t.guestAccount.removeFavorite}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
