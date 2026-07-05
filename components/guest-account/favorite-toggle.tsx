"use client";

import { useState, useEffect } from "react";
import { Heart } from "@phosphor-icons/react";
import { useSession } from "next-auth/react";

export default function FavoriteToggle({ hotelId }: { hotelId: string }) {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role !== "GUEST") return;
    fetch("/api/favorites")
      .then((res) => res.json())
      .then((data) => {
        const exists = (data.favorites || []).some((f: { hotelId: string }) => f.hotelId === hotelId);
        setFavorited(exists);
      })
      .catch(() => {});
  }, [hotelId, role]);

  if (role !== "GUEST") return null;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    if (favorited) {
      await fetch(`/api/favorites/${hotelId}`, { method: "DELETE" });
      setFavorited(false);
    } else {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId }),
      });
      setFavorited(true);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="flex min-h-9 min-w-9 items-center justify-center rounded-full border border-border-strong bg-surface-raised p-2 transition-colors hover:border-gold"
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
    >
      <Heart
        size={16}
        weight={favorited ? "fill" : "regular"}
        className={favorited ? "text-gold-bright" : "text-on-surface-muted"}
      />
    </button>
  );
}
