"use client";

import { useLanguage } from "@/app/providers";
import { Input } from "@/components/ui/Input";

interface RoomSelectionProps {
  roomTypeName: string;
  pricePerNight: number;
  nights: number;
  quantity: number;
  onQuantityChange: (q: number) => void;
}

export function RoomSelection({ roomTypeName, pricePerNight, nights, quantity, onQuantityChange }: RoomSelectionProps) {
  const { t } = useLanguage();
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h3 className="font-semibold text-[var(--color-text)]">{roomTypeName}</h3>
      <p className="text-sm text-[var(--color-text-muted)]">
        {pricePerNight} {t.search.perNight} · {nights} {t.booking.nights}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <Input
          label={t.booking.quantity}
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
          className="w-20"
        />
      </div>
    </div>
  );
}
