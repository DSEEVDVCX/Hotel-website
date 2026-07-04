"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
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

  const handleBook = () => {
    const params = new URLSearchParams({
      hotelId: room.hotelId,
      roomTypeId: room.roomTypeId,
      checkIn,
      checkOut,
    });
    router.push(`/hotels/${room.hotelId}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-lg">
      {room.photos[0] && (
        <img
          src={room.photos[0]}
          alt={name}
          className="h-48 w-full rounded-lg object-cover"
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">{name}</h3>
          <p className="text-sm text-[var(--color-text-muted)]">{hotelName} {"★".repeat(room.starRating)}</p>
        </div>
        <span className="rounded-full bg-[var(--color-surface-2)] px-3 py-1 text-sm">
          {room.availableRooms} {t.search.availableRooms}
        </span>
      </div>
      <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
        <div>
          <span className="text-2xl font-bold text-[var(--color-accent)]">
            {room.pricePerNight.toFixed(2)}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]"> {t.search.perNight}</span>
          <p className="text-sm text-[var(--color-text-muted)]">
            {t.booking.total}: {room.totalPrice.toFixed(2)} {room.currency}
          </p>
        </div>
        <Button onClick={handleBook} size="md">{t.search.bookNow}</Button>
      </div>
    </div>
  );
}
