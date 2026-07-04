"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";

export default function HotelDetailPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { locale, t } = useLanguage();
  const [hotel, setHotel] = useState<any>(null);

  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";

  useEffect(() => {
    if (!checkIn || !checkOut) return;
    fetch(`/api/hotels/${hotelId}?checkIn=${checkIn}&checkOut=${checkOut}`)
      .then((res) => res.json())
      .then(setHotel)
      .catch(() => {});
  }, [hotelId, checkIn, checkOut]);

  if (!hotel) return <main className="px-4 py-8">...</main>;

  const name = locale === "ar" ? hotel.nameAr : hotel.nameEn;
  const description = locale === "ar" ? hotel.descriptionAr : hotel.descriptionEn;

  const handleBookRoomType = (roomTypeId: string) => {
    router.push(`/booking/checkout?hotelId=${hotelId}&roomTypeId=${roomTypeId}&checkIn=${checkIn}&checkOut=${checkOut}&quantity=1`);
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {hotel.photos?.[0] && (
        <img src={hotel.photos[0]} alt={name} className="mb-6 h-64 w-full rounded-xl object-cover" />
      )}
      <h1 className="text-3xl font-bold text-[var(--color-text)]">{name}</h1>
      <p className="mt-2 text-[var(--color-text-muted)]">{description}</p>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        {"★".repeat(hotel.starRating)} · {hotel.city}
      </p>

      <h2 className="mt-8 text-xl font-semibold text-[var(--color-text)]">{t.search.title}</h2>
      <div className="mt-4 grid gap-4">
        {hotel.roomTypes?.map((rt: any) => {
          const rtName = locale === "ar" ? rt.nameAr : rt.nameEn;
          const available = rt.rooms?.length || 0;
          return (
            <div key={rt.id} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div>
                <h3 className="text-lg font-semibold">{rtName}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {available} {t.search.availableRooms} · {rt.basePrice} {t.search.perNight}
                </p>
              </div>
              {available > 0 && (
                <Button onClick={() => handleBookRoomType(rt.id)}>{t.search.bookNow}</Button>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
