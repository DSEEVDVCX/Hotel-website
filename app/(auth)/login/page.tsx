"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn, signOut } from "next-auth/react";
import { useLanguage } from "@/app/providers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowRight, Key, ShieldCheck, Sparkle } from "@phosphor-icons/react";

function safeCallbackPath(raw: string | null, fallback: string, requiredPrefix?: string) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (requiredPrefix && !raw.startsWith(requiredPrefix)) return fallback;
  return raw;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = safeCallbackPath(searchParams.get("callbackUrl"), "/account");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t.auth.invalidCredentials);
      setLoading(false);
    } else {
      // Fetch session to determine role-based redirect
      try {
        const res = await fetch("/api/auth/session");
        const session = await res.json();
        const role = session?.user?.role;

        // Buyer portal: admins must use the admin login page.
        if (role === "ADMIN") {
          await signOut({ redirect: false });
          setError(t.auth.wrongPortalAdmin);
          setLoading(false);
          return;
        }

        router.push(callbackUrl);
      } catch {
        router.push("/");
      }
    }
  };

  return (
    <>
      <div className="mb-8">
        <span className="eyebrow">{t.auth.loginEyebrow}</span>
        <h1 className="display-sm mt-5 font-display text-primary">{t.auth.loginTitle}</h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-muted">{t.auth.loginVisualBody}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t.auth.email} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <Input label={t.auth.password} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
        <Button type="submit" size="lg" disabled={loading} className="group w-full">
          {loading ? t.auth.loggingIn : t.auth.loginBtn}
          <span className="btn-well"><ArrowRight size={13} weight="bold" className="rtl:rotate-180" aria-hidden /></span>
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-on-surface-muted">
        {t.auth.noAccount}{" "}
        <Link href="/register" className="link-underline font-semibold text-primary-hover">{t.auth.registerLink}</Link>
      </p>
      <p className="mt-3 text-center text-xs text-on-surface-subtle">
        <Link href="/admin/login" className="link-underline">{t.auth.adminPortalLink}</Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  const { t, locale } = useLanguage();

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-surface px-5 py-10 lg:px-8">
      <div className="ambient-glow ambient-emerald -start-24 top-12 h-72 w-72" />
      <div className="ambient-glow ambient-gold -end-20 bottom-10 h-80 w-80" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.35] pattern-bg" />

      <section className="relative z-10 mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="hidden lg:block">
          <div className="rounded-[2.25rem] border border-gold/20 bg-surface-raised/80 p-2 shadow-sm">
            <div className="relative overflow-hidden rounded-[calc(2.25rem-0.5rem)] bg-surface-dark p-10 text-on-dark shadow-[inset_0_1px_1px_rgba(255,255,255,0.16)]">
              <div className="absolute -end-24 -top-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
              <div className="absolute -bottom-24 -start-24 h-72 w-72 rounded-full bg-primary/35 blur-3xl" />
              <div className="relative z-10">
                <span className="eyebrow on-dark">{locale === "ar" ? "إيقاع أندلسي" : "Andalusian rhythm"}</span>
                <h2 className="mt-8 max-w-3xl font-display text-[clamp(2.8rem,5vw,5.8rem)] font-bold leading-[1.05] text-on-dark">
                  {t.auth.loginVisualTitle}
                </h2>
                <p className="mt-6 max-w-xl text-base leading-8 text-on-dark/70">{t.auth.loginVisualBody}</p>
                <div className="mt-10 grid grid-cols-3 gap-3">
                  {[
                    { icon: ShieldCheck, label: locale === "ar" ? "آمن" : "Secure" },
                    { icon: Key, label: locale === "ar" ? "خاص" : "Private" },
                    { icon: Sparkle, label: locale === "ar" ? "راقي" : "Refined" },
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
        </div>

        <div className="mx-auto w-full max-w-md rounded-[2rem] border border-gold/20 bg-surface-raised/85 p-2 shadow-sm">
          <div className="rounded-[calc(2rem-0.5rem)] border border-border bg-surface p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] sm:p-9">
            <Suspense fallback={<div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
