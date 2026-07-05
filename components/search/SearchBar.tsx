"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { MagnifyingGlass } from "@phosphor-icons/react";

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
    <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end" aria-label={t.search.title}>
      <div>
        <label htmlFor="search-city" className="field-label">{t.search.destination}</label>
        <input id="search-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder={t.search.destination} required className="field" autoComplete="off" />
      </div>
      <div>
        <label htmlFor="search-checkin" className="field-label">{t.search.checkIn}</label>
        <input id="search-checkin" type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required className="field" />
      </div>
      <div>
        <label htmlFor="search-checkout" className="field-label">{t.search.checkOut}</label>
        <input id="search-checkout" type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required className="field" />
      </div>
      <div>
        <label htmlFor="search-guests" className="field-label">{t.search.guests}</label>
        <input id="search-guests" type="number" min="1" value={guests} onChange={(e) => setGuests(e.target.value)} required className="field" />
      </div>
      <button type="submit" className="btn btn-primary">
        <MagnifyingGlass size={16} weight="bold" aria-hidden />
        {t.search.searchBtn}
      </button>
    </form>
  );
}
