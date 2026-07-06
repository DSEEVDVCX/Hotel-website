"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowRight, Buildings, ShieldCheck, SlidersHorizontal } from "@phosphor-icons/react";

function safeCallbackPath(raw: string | null, fallback: string, requiredPrefix?: string) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (requiredPrefix && !raw.startsWith(requiredPrefix)) return fallback;
  return raw;
}

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = safeCallbackPath(searchParams.get("callbackUrl"), "/admin", "/admin");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError(t.auth.invalidCredentials);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/session");
      const session = await res.json();
      const role = session?.user?.role;

      // Admin portal: guests must use the buyer login page.
      if (role !== "ADMIN") {
        await signOut({ redirect: false });
        setError(t.auth.wrongPortalGuest);
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
    } catch {
      router.push("/admin/login");
    }
  };

  return (
    <>
      <div className="mb-8">
        <span className="eyebrow">{t.auth.adminLoginSubtitle}</span>
        <h1 className="display-sm mt-5 font-display text-primary">{t.auth.adminLoginTitle}</h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-muted">{t.auth.adminVisualBody}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t.auth.email} type="text" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" />
        <Input label={t.auth.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        <Button type="submit" size="lg" disabled={loading} className="group w-full">
          {loading ? t.auth.loggingIn : t.auth.loginBtn}
          <span className="btn-well"><ArrowRight size={13} weight="bold" className="rtl:rotate-180" aria-hidden /></span>
        </Button>
      </form>
      <p className="mt-6 text-center text-xs text-on-surface-subtle">
        <Link href="/login" className="link-underline">{t.auth.loginLink}</Link>
      </p>
    </>
  );
}

export default function AdminLoginPage() {
  const { t, locale } = useLanguage();

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-surface-dark px-5 py-10 text-on-dark lg:px-8">
      <div className="absolute -start-24 top-10 h-80 w-80 rounded-full bg-primary/40 blur-3xl" />
      <div className="absolute -end-20 bottom-0 h-96 w-96 rounded-full bg-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] pattern-bg" />

      <section className="relative z-10 mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-2 shadow-sm">
          <div className="rounded-[calc(2rem-0.5rem)] border border-white/10 bg-surface p-7 text-on-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] sm:p-9">
            <Suspense fallback={<div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />}>
              <AdminLoginForm />
            </Suspense>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="rounded-[2.25rem] border border-white/10 bg-white/[0.05] p-2">
            <div className="relative overflow-hidden rounded-[calc(2.25rem-0.5rem)] border border-white/10 bg-[#0b1512] p-10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)]">
              <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
              <span className="eyebrow">{locale === "ar" ? "مركز القيادة" : "Command center"}</span>
              <h2 className="mt-8 max-w-3xl font-display text-[clamp(2.8rem,5vw,5.8rem)] font-bold leading-[1.05] text-on-dark">
                {t.auth.adminVisualTitle}
              </h2>
              <p className="mt-6 max-w-xl text-base leading-8 text-on-dark/70">{t.auth.adminVisualBody}</p>
              <div className="mt-10 grid grid-cols-3 gap-3">
                {[
                  { icon: Buildings, label: locale === "ar" ? "فنادق" : "Hotels" },
                  { icon: SlidersHorizontal, label: locale === "ar" ? "تحكم" : "Control" },
                  { icon: ShieldCheck, label: locale === "ar" ? "صلاحيات" : "Access" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                    <item.icon size={20} weight="light" className="text-gold-bright" aria-hidden />
                    <p className="mt-3 font-kufi text-xs text-on-dark/75">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
