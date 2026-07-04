"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function SearchBar() {
  const router = useRouter();
  const { t } = useLanguage();
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({ city, checkIn, checkOut, guests });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
      <Input
        label={t.search.destination}
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder={t.search.destination}
        required
      />
      <Input
        label={t.search.checkIn}
        type="date"
        value={checkIn}
        onChange={(e) => setCheckIn(e.target.value)}
        required
      />
      <Input
        label={t.search.checkOut}
        type="date"
        value={checkOut}
        onChange={(e) => setCheckOut(e.target.value)}
        required
      />
      <Input
        label={t.search.guests}
        type="number"
        min="1"
        value={guests}
        onChange={(e) => setGuests(e.target.value)}
        required
      />
      <Button type="submit" size="md">{t.search.searchBtn}</Button>
    </form>
  );
}
