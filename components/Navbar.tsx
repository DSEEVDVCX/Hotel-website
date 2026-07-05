"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { List, X, Sun, Moon, ArrowRight, User, SignOut } from "@phosphor-icons/react";
import { signOut, useSession } from "next-auth/react";
import { useLanguage, useTheme } from "@/app/providers";

const NAV_IDS = ["rooms", "experiences", "why", "stories", "contact"] as const;

export default function Navbar({ heroDark = false }: { heroDark?: boolean }) {
  const { t, toggle, locale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeId] = useState("");

  const role = (session?.user as { role?: string } | undefined)?.role;
  const isLoggedIn = status === "authenticated" && !!session;

  const accountHref = role === "ADMIN" ? "/admin" : "/account";
  const accountLabel = role === "ADMIN" ? t.admin.title : t.guestAccount.title;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Only pages with a dark hero behind the navbar get light-on-dark text.
  // Once scrolled (glass background appears) or on non-hero pages, use dark text.
  const dark = heroDark && !scrolled && !open;
  const navLinks = t.nav.links.filter((l: { id: string }) => NAV_IDS.includes(l.id as typeof NAV_IDS[number]));

  const go = useCallback((id: string) => {
    setOpen(false);
    // Scroll to the section if it exists on the current page (the homepage has
    // them all; /rooms only has #rooms and #contact). Otherwise navigate to the
    // homepage anchor so the nav works from any page.
    const el = typeof document !== "undefined" ? document.getElementById(id) : null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    router.push(id === "top" ? "/" : `/#${id}`);
  }, [router]);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 transition-all duration-300 lg:px-8 ${
          scrolled
            ? "mt-3 rounded-full border border-gold/30 glass py-2 shadow-md"
            : dark
              ? "py-4"
              : "py-4 bg-surface/80 backdrop-blur-sm"
        }`}
        style={{ transitionTimingFunction: "var(--ease-standard)" }}
      >
        {/* Wordmark */}
        <button onClick={() => go("top")} className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-1" aria-label={t.brand.name}>
          <span className={`font-display text-xl font-bold tracking-tight transition-colors duration-300 ${dark ? "text-on-dark" : "text-primary"}`}>
            {t.brand.name}
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {navLinks.map((link: { id: string; label: string }) => (
            <button
              key={link.id}
              onClick={() => go(link.id)}
              aria-current={activeId === link.id ? "true" : undefined}
              className={`min-h-11 rounded-full px-3.5 font-kufi text-sm font-medium transition-colors duration-200 ${
                dark
                  ? activeId === link.id ? "text-gold-bright bg-white/10" : "text-on-dark/80 hover:text-gold-bright hover:bg-white/5"
                  : activeId === link.id ? "text-gold-deep bg-gold-glint" : "text-on-surface-muted hover:text-primary hover:bg-surface-muted"
              }`}
              style={{ transitionTimingFunction: "var(--ease-standard)" }}
            >
              {link.label}
            </button>
          ))}
          <Link
            href="/rooms"
            className={`min-h-11 inline-flex items-center rounded-full px-3.5 font-kufi text-sm font-medium transition-colors duration-200 ${
              dark
                ? "text-on-dark/80 hover:text-gold-bright hover:bg-white/5"
                : "text-on-surface-muted hover:text-primary hover:bg-surface-muted"
            }`}
            style={{ transitionTimingFunction: "var(--ease-standard)" }}
          >
            {t.nav.allRooms}
          </Link>
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5">
          {isLoggedIn ? (
            <>
              <Link
                href={accountHref}
                className={`hidden min-h-11 items-center gap-1.5 rounded-full border px-3.5 font-kufi text-xs font-medium transition-colors duration-200 sm:flex ${dark ? "border-white/20 text-on-dark/85 hover:border-gold hover:text-gold-bright" : "border-border-strong text-on-surface-muted hover:border-gold hover:text-gold-deep"}`}
                style={{ transitionTimingFunction: "var(--ease-standard)" }}
              >
                <User size={15} weight="light" aria-hidden />
                {accountLabel}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border transition-colors duration-200 ${dark ? "border-white/20 text-on-dark/85 hover:border-error hover:text-error" : "border-border-strong text-on-surface-muted hover:border-error hover:text-error"}`}
                style={{ transitionTimingFunction: "var(--ease-standard)" }}
                aria-label={locale === "ar" ? "خروج" : "Logout"}
              >
                <SignOut size={16} weight="light" aria-hidden />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={`hidden min-h-11 items-center rounded-full border px-3.5 font-kufi text-xs font-medium transition-colors duration-200 sm:flex ${dark ? "border-white/20 text-on-dark/85 hover:border-gold hover:text-gold-bright" : "border-border-strong text-on-surface-muted hover:border-gold hover:text-gold-deep"}`}
              style={{ transitionTimingFunction: "var(--ease-standard)" }}
            >
              {locale === "ar" ? "دخول" : "Login"}
            </Link>
          )}

          <button onClick={toggleTheme} className={`flex min-h-11 min-w-11 items-center justify-center rounded-full border transition-colors duration-200 ${dark ? "border-white/20 text-on-dark/85 hover:border-gold hover:text-gold-bright" : "border-border-strong text-on-surface-muted hover:border-gold hover:text-gold-deep"}`} style={{ transitionTimingFunction: "var(--ease-standard)" }} aria-label={theme === "dark" ? "Light mode" : "Dark mode"}>
            {theme === "dark" ? <Sun size={16} weight="light" aria-hidden /> : <Moon size={16} weight="light" aria-hidden />}
          </button>

          <button onClick={toggle} className={`flex min-h-11 items-center rounded-full border px-3 font-kufi text-xs font-medium transition-colors duration-200 ${dark ? "border-white/20 text-on-dark/85 hover:border-gold hover:text-gold-bright" : "border-border-strong text-on-surface-muted hover:border-gold hover:text-gold-deep"}`} style={{ transitionTimingFunction: "var(--ease-standard)" }} aria-label="Switch language">
            <span className={locale === "ar" ? "text-gold-bright" : ""}>ع</span>
            <span className={dark ? "text-on-dark/40" : "text-on-surface-subtle"}>/</span>
            <span className={locale === "en" ? "text-gold-bright" : ""}>EN</span>
          </button>

          {/* Primary CTA */}
          <button onClick={() => go("rooms")} className="btn btn-primary hidden items-center gap-2 sm:inline-flex">
            {t.nav.cta}
            <span className="btn-well"><ArrowRight size={12} weight="bold" className="rtl:rotate-180" aria-hidden /></span>
          </button>

          {/* Hamburger */}
          <button onClick={() => setOpen(!open)} className={`relative flex min-h-11 min-w-11 items-center justify-center rounded-full border transition-colors duration-200 lg:hidden ${dark ? "border-white/20 text-on-dark" : "border-border-strong text-on-surface"}`} style={{ transitionTimingFunction: "var(--ease-standard)" }} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-nav">
            <motion.span animate={{ rotate: open ? 90 : 0, opacity: open ? 0 : 1 }} transition={{ duration: 0.2 }} className="absolute"><List size={18} aria-hidden /></motion.span>
            <motion.span animate={{ rotate: open ? 0 : -90, opacity: open ? 1 : 0 }} transition={{ duration: 0.2 }} className="absolute"><X size={18} aria-hidden /></motion.span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <AnimatePresence>
        {open && (
          <motion.div id="mobile-nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }} className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Mobile navigation">
            <div className="glass absolute inset-0" onClick={() => setOpen(false)} />
            <nav className="relative z-10 flex h-full flex-col justify-center px-8">
              {navLinks.map((link: { id: string; label: string }, i: number) => (
                <motion.button key={link.id} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.3, delay: 0.05 + i * 0.05, ease: [0.2, 0, 0, 1] }} onClick={() => go(link.id)} className={`min-h-14 border-b border-border py-4 text-start font-display text-2xl font-bold ${dark ? "text-on-dark" : "text-on-surface"}`}>
                  <span className="font-kufi text-xs font-medium text-gold-deep">{String(i + 1).padStart(2, "0")}</span>{"  "}{link.label}
                </motion.button>
              ))}
              <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.3, delay: 0.05 + navLinks.length * 0.05, ease: [0.2, 0, 0, 1] }}>
                <Link href="/rooms" onClick={() => setOpen(false)} className={`block min-h-14 border-b border-border py-4 text-start font-display text-2xl font-bold ${dark ? "text-on-dark" : "text-on-surface"}`}>
                  <span className="font-kufi text-xs font-medium text-gold-deep">{String(navLinks.length + 1).padStart(2, "0")}</span>{"  "}{t.nav.allRooms}
                </Link>
              </motion.div>
              <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} transition={{ duration: 0.3, delay: 0.05 + navLinks.length * 0.05, ease: [0.2, 0, 0, 1] }} className="mt-8 flex gap-3">
                {isLoggedIn ? (
                  <>
                    <Link href={accountHref} className="btn btn-primary flex-1">
                      <User size={16} weight="light" aria-hidden />
                      {accountLabel}
                    </Link>
                    <button onClick={() => signOut({ callbackUrl: "/" })} className="btn btn-secondary px-5">
                      <SignOut size={16} weight="light" aria-hidden />
                      {locale === "ar" ? "خروج" : "Logout"}
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="btn btn-primary flex-1">
                    {locale === "ar" ? "دخول" : "Login"}
                  </Link>
                )}
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
