"use client";

import { useState } from "react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Check, Lock, Eye, EyeSlash } from "@phosphor-icons/react";

export default function PasswordForm() {
  const { t } = useLanguage();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
    setSaved(false);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    setError("");

    if (next.length < 8) {
      setError(t.guestAccount.passwordTooShort);
      return;
    }
    if (next !== confirm) {
      setError(t.guestAccount.passwordMismatch);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });

      if (!res.ok) {
        const data = await res.json();
        const code = data.error as string | undefined;
        setError(code === "passwordIncorrect" ? t.guestAccount.passwordIncorrect : code === "sameAsOld" ? t.guestAccount.sameAsOld : "Failed to save");
        setSaving(false);
        return;
      }

      reset();
      setSaved(true);
    } catch {
      setError("Network error");
    }
    setSaving(false);
  };

  const inputBase = "field pe-10";

  return (
    <div className="card p-6">
      <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold text-on-surface">
        <Lock size={20} weight="light" className="text-gold-deep" aria-hidden />
        {t.guestAccount.changePassword}
      </h2>
      <p className="mb-6 text-sm text-on-surface-muted">
        {t.guestAccount.dashboard} · {t.guestAccount.security}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">{t.guestAccount.currentPassword}</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={inputBase}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-muted hover:text-on-surface"
              aria-label={showCurrent ? "hide" : "show"}
            >
              {showCurrent ? <EyeSlash size={16} weight="light" /> : <Eye size={16} weight="light" />}
            </button>
          </div>
        </div>

        <div>
          <label className="field-label">{t.guestAccount.newPassword}</label>
          <div className="relative">
            <input
              type={showNext ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              className={inputBase}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNext((v) => !v)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-muted hover:text-on-surface"
              aria-label={showNext ? "hide" : "show"}
            >
              {showNext ? <EyeSlash size={16} weight="light" /> : <Eye size={16} weight="light" />}
            </button>
          </div>
        </div>

        <div>
          <label className="field-label">{t.guestAccount.confirmPassword}</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={inputBase}
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-on-surface-muted hover:text-on-surface"
              aria-label={showConfirm ? "hide" : "show"}
            >
              {showConfirm ? <EyeSlash size={16} weight="light" /> : <Eye size={16} weight="light" />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-error" role="alert">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "..." : t.guestAccount.changePassword}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check size={16} weight="light" aria-hidden />
              {t.guestAccount.passwordChanged}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
