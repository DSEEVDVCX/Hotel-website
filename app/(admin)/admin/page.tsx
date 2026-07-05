"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReportsDashboard } from "@/components/admin/reports-dashboard";

export default function AdminPage() {
  const { data: session } = useSession();
  const { locale, t } = useLanguage();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (role !== "ADMIN") return;
    fetch("/api/admin/hotels")
      .then((res) => res.json())
      .then((data) => {
        setHotels(data.hotels || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [role]);

  const handleAction = async (hotelId: string, action: "approve" | "suspend" | "reinstate") => {
    await fetch(`/api/admin/hotels/${hotelId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const res = await fetch("/api/admin/hotels");
    const data = await res.json();
    setHotels(data.hotels || []);
  };

  if (role !== "ADMIN") return <EmptyState />;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-on-surface font-display">{t.admin.title}</h1>

      <section className="mb-10 rounded-2xl border border-border bg-surface-muted p-5">
        <ReportsDashboard />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-on-surface">{t.admin.hotels}</h2>
        {loading ? (
          <p className="text-on-surface-muted">...</p>
        ) : hotels.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-3">
            {hotels.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-raised p-4">
                <div>
                  <p className="font-medium text-on-surface">{locale === "ar" ? h.nameAr : h.nameEn}</p>
                  <p className="text-sm text-on-surface-muted">
                    {h.owner?.name} · {h.status}{h.isFeatured ? " · ★" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  {h.status === "PENDING" && (
                    <Button size="sm" onClick={() => handleAction(h.id, "approve")}>{t.admin.approve}</Button>
                  )}
                  {h.status === "ACTIVE" && (
                    <Button size="sm" variant="outline" onClick={() => handleAction(h.id, "suspend")}>{t.admin.suspend}</Button>
                  )}
                  {h.status === "SUSPENDED" && (
                    <Button size="sm" variant="outline" onClick={() => handleAction(h.id, "reinstate")}>{t.admin.reinstate}</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
