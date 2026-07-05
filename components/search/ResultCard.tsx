"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/app/providers";
import { Star, MapPin, ArrowRight } from "@phosphor-icons/react";
import type { AvailableRoomType } from "@/lib/availability";

interface ResultCardProps {
  room: AvailableRoomType;
  checkIn: string;
  checkOut: string;
}

export function ResultCard({ room, checkIn, checkOut }: ResultCardProps) {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const name = locale === "ar" ? room.roomTypeNameAr : room.roomTypeNameEn;
  const hotelName = locale === "ar" ? room.hotelNameAr : room.hotelNameEn;
  const currency = locale === "ar" ? "ر.س" : room.currency || "SAR";

  const handleBook = () => {
    const params = new URLSearchParams({
      hotelId: room.hotelId,
      roomTypeId: room.roomTypeId,
      checkIn,
      checkOut,
    });
    router.push(`/hotels/${room.hotelId}?${params.toString()}`);
  };

  const photo = room.photos?.[0] || `https://picsum.photos/seed/sewar-search-${room.roomTypeId?.slice(-4)}/600/400`;

  return (
    <div className="card group overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image src={photo} alt={name} fill unoptimized sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover img-elegant transition-transform duration-500 group-hover:scale-105" style={{ transitionTimingFunction: "var(--ease-standard)" }} />
        {room.availableRooms > 0 && (
          <span className="absolute start-3 top-3 rounded-full bg-success/90 px-2.5 py-1 text-xs font-semibold text-on-dark">
            {room.availableRooms} {t.search.availableRooms}
          </span>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center gap-1 text-primary" aria-label={`${room.starRating} ${locale === "ar" ? "نجوم" : "stars"}`}>
          {Array.from({ length: room.starRating }).map((_, i) => (
            <Star key={i} size={13} weight="fill" aria-hidden />
          ))}
        </div>
        <h3 className="mt-1.5 font-display text-lg font-bold text-on-surface">{name}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-muted">
          <MapPin size={13} weight="light" aria-hidden />
          {hotelName}
        </p>

        <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
          <div>
            <span className="font-display text-xl font-bold text-primary-hover" style={{ fontVariantNumeric: "tabular-nums" }}>
              {room.pricePerNight.toFixed(0)} {currency}
            </span>
            <span className="ms-1 text-xs text-on-surface-muted">/ {t.search.perNight}</span>
            <p className="mt-0.5 text-sm text-on-surface-muted" style={{ fontVariantNumeric: "tabular-nums" }}>
              {t.booking.total}: {room.totalPrice.toFixed(0)} {currency}
            </p>
          </div>
          <button onClick={handleBook} className="btn btn-primary text-xs">
            {t.search.bookNow}
            <ArrowRight size={14} weight="bold" className="rtl:rotate-180" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
