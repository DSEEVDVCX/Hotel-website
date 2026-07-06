"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { MagnifyingGlass } from "@phosphor-icons/react";

export function SearchBar() {
  const router = useRouter();
  const { t } = useLanguage();
  const localDate = (offsetDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };
  const today = localDate(0);
  const tomorrow = localDate(1);
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests, setGuests] = useState("2");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mounted) return;
    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) return;
    const params = new URLSearchParams({ city, checkIn, checkOut, guests });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form action="/search" method="get" onSubmit={handleSearch} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end" aria-label={t.search.title}>
      <div>
        <label htmlFor="search-city" className="field-label">{t.search.destination}</label>
        <input id="search-city" name="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t.search.destination} required disabled={!mounted} className="field" autoComplete="off" />
      </div>
      <div>
        <label htmlFor="search-checkin" className="field-label">{t.search.checkIn}</label>
        <input id="search-checkin" name="checkIn" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required min={today} disabled={!mounted} className="field" />
      </div>
      <div>
        <label htmlFor="search-checkout" className="field-label">{t.search.checkOut}</label>
        <input id="search-checkout" name="checkOut" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required min={checkIn || today} disabled={!mounted} className="field" />
      </div>
      <div>
        <label htmlFor="search-guests" className="field-label">{t.search.guests}</label>
        <input id="search-guests" name="guests" type="number" min="1" value={guests} onChange={(e) => setGuests(e.target.value)} required disabled={!mounted} className="field" />
      </div>
      <button type="submit" disabled={!mounted} className="btn btn-primary disabled:opacity-60">
        <MagnifyingGlass size={16} weight="bold" aria-hidden />
        {t.search.searchBtn}
      </button>
    </form>
  );
}
