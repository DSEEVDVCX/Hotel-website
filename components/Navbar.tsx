"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { List, X, ArrowUpRight, Sun, Moon, Bed } from "@phosphor-icons/react";
import { useLanguage, useTheme } from "@/app/providers";

export default function Navbar() {
  const { t, toggle, locale } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const dark = !scrolled && !open;

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        dark
          ? "bg-transparent py-2"
          : "py-2"
      }`}
    >
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between px-6 transition-all duration-500 lg:px-8 ${
          dark ? "py-3" : "py-2"
        }`}
      >
        {/* When scrolled, wrap in a floating glass island */}
        <div
          className={`flex w-full items-center justify-between transition-all duration-500 ${
            dark
              ? ""
              : "rounded-full border border-line bg-paper/80 px-5 py-2 shadow-soft backdrop-blur-xl"
          }`}
        >
          <button
            onClick={() => go("top")}
            className="flex shrink-0 items-center gap-3"
            aria-label={t.brand.name}
          >
            <Image
              src="/images/logo.png"
              alt={t.brand.name}
              width={150}
              height={125}
              priority
              className={`h-10 w-auto object-contain transition-all duration-500 ${dark ? "brightness-0 invert" : ""}`}
            />
          </button>

          {/* desktop links */}
          <div className="hidden items-center gap-1 lg:flex">
            {t.nav.links.map((link, i) => (
              <button
                key={link.id}
                onClick={() => go(link.id)}
                className={`group relative rounded-full px-4 py-2 text-sm transition-colors ${
                  dark
                    ? "text-cream/80 hover:text-cream"
                    : "text-ink-soft hover:text-gold-deep"
                }`}
              >
                <span className="relative z-10">{link.label}</span>
                <span
                  className={`absolute inset-0 scale-90 rounded-full opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 ${
                    dark ? "bg-white/10" : "bg-gold/10"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/search"
              className={`group flex h-9 items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-colors ${
                dark
                  ? "border-gold-soft/40 bg-gold-soft/10 text-gold-soft hover:bg-gold-soft/20"
                  : "border-gold/30 bg-gold/10 text-gold-deep hover:bg-gold/20"
              }`}
            >
              <Bed size={14} weight="duotone" />
              <span>{locale === "ar" ? "احجز غرفة" : "Book a Room"}</span>
            </Link>

            <Link
              href="/login"
              className={`hidden h-9 items-center rounded-full border px-4 text-xs font-medium transition-colors sm:flex ${
                dark
                  ? "border-cream/20 text-cream/80 hover:border-gold-soft hover:text-gold-soft"
                  : "border-line text-ink-soft hover:border-gold hover:text-gold-deep"
              }`}
            >
              {locale === "ar" ? "دخول" : "Login"}
            </Link>

            <button
              onClick={toggleTheme}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                dark
                  ? "border-cream/20 text-cream/80 hover:border-gold-soft hover:text-gold-soft"
                  : "border-line text-ink-soft hover:border-gold hover:text-gold-deep"
              }`}
              aria-label="theme"
            >
              {theme === "dark" ? <Sun size={16} weight="duotone" /> : <Moon size={16} weight="duotone" />}
            </button>

            <button
              onClick={toggle}
              className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
                dark
                  ? "border-cream/20 text-cream/80 hover:border-gold-soft hover:text-gold-soft"
                  : "border-line text-ink-soft hover:border-gold hover:text-gold-deep"
              }`}
              aria-label="language"
            >
              <span className={locale === "ar" ? "text-gold-soft" : ""}>ع</span>
              <span className={dark ? "text-cream/40" : "text-muted"}>/</span>
              <span className={locale === "en" ? "text-gold-soft" : ""}>EN</span>
            </button>

            <button
              onClick={() => go("contact")}
              className="btn-gold group hidden items-center gap-2 px-5 py-2.5 text-sm sm:inline-flex"
            >
              {t.nav.cta}
              <span className="btn-well">
                <ArrowUpRight size={13} weight="bold" />
              </span>
            </button>

            <button
              onClick={() => setOpen(!open)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors lg:hidden ${
                dark ? "border-cream/20 text-cream" : "border-line text-ink"
              }`}
              aria-label="Menu"
            >
              {open ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-line bg-paper lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
              {t.nav.links.map((link) => (
                <button
                  key={link.id}
                  onClick={() => go(link.id)}
                  className="rounded-xl px-4 py-3 text-start text-base text-ink-soft transition-colors hover:bg-cream hover:text-gold-deep"
                >
                  {link.label}
                </button>
              ))}
              <button
                onClick={() => go("contact")}
                className="btn-gold mt-2 px-5 py-3 text-sm"
              >
                {t.nav.cta}
              </button>

              <div className="mt-3 flex gap-2 border-t border-line pt-3">
                <Link
                  href="/search"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold/10 px-4 py-3 text-sm font-medium text-gold-deep transition-colors hover:bg-gold/20"
                >
                  <Bed size={16} weight="duotone" />
                  {locale === "ar" ? "احجز غرفة" : "Book a Room"}
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center rounded-xl border border-line px-4 py-3 text-sm text-ink-soft transition-colors hover:border-gold hover:text-gold-deep"
                >
                  {locale === "ar" ? "دخول" : "Login"}
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
