"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, role: "GUEST" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Registration failed");
        return;
      }

      router.push("/login");
    } catch {
      setError("Registration failed. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-5 py-12">
      <div className="mb-8 text-center">
        <h1 className="display-sm font-display text-primary">{t.auth.registerTitle}</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t.auth.name} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        <Input label={t.auth.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <Input label={t.auth.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        <Button type="submit" size="lg" disabled={loading} className="w-full">{loading ? "جاري إنشاء الحساب..." : t.auth.registerBtn}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-on-surface-muted">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="link-underline font-semibold text-primary-hover">{t.auth.loginLink}</Link>
      </p>
    </main>
  );
}
