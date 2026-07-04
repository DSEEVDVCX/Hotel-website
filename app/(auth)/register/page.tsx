"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"GUEST" | "HOTELIER">("GUEST");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name, role }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }

    router.push("/login");
  };

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">{t.auth.registerTitle}</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label={t.auth.name} value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label={t.auth.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input label={t.auth.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[var(--color-text)]">{t.auth.role}</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "GUEST" | "HOTELIER")}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
          >
            <option value="GUEST">{t.auth.guest}</option>
            <option value="HOTELIER">{t.auth.hotelier}</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? "..." : t.auth.registerBtn}</Button>
      </form>
      <p className="mt-4 text-sm text-[var(--color-text-muted)]">
        {t.auth.haveAccount}{" "}
        <a href="/login" className="text-[var(--color-accent)] underline">{t.auth.loginLink}</a>
      </p>
    </main>
  );
}
