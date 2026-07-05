"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/providers";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Check, EnvelopeSimple, Phone, UserCircle } from "@phosphor-icons/react";

export default function ProfileForm() {
  const { t } = useLanguage();
  const { data: session, update: updateSession } = useSession();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/user")
      .then((res) => res.json())
      .then((data) => {
        setName(data.name ?? "");
        setPhone(data.phoneNumber ?? "");
      })
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phoneNumber: phone }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        setSaving(false);
        return;
      }

      await updateSession({ name });
      setSaved(true);
    } catch {
      setError("Network error");
    }
    setSaving(false);
  };

  return (
    <div className="card p-6">
      <h2 className="mb-6 font-display text-lg font-bold text-on-surface">{t.guestAccount.profile}</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="field-label">
            <span className="inline-flex items-center gap-1.5"><UserCircle size={14} weight="light" aria-hidden />{t.auth.name}</span>
          </label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="field" required />
        </div>
        <div>
          <label className="field-label">
            <span className="inline-flex items-center gap-1.5"><EnvelopeSimple size={14} weight="light" aria-hidden />{t.auth.email}</span>
          </label>
          <input type="email" value={session?.user?.email ?? ""} disabled className="field bg-surface-muted" />
        </div>
        <div>
          <label className="field-label">
            <span className="inline-flex items-center gap-1.5"><Phone size={14} weight="light" aria-hidden />{t.booking.phone}</span>
          </label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5x xxx xxxx" className="field" />
        </div>

        {error && <p className="text-sm text-error" role="alert">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "..." : t.guestAccount.saveChanges}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check size={16} weight="light" aria-hidden />
              {t.guestAccount.saveChanges === "حفظ التغييرات" ? "تم الحفظ" : "Saved"}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
