"use client";

import Link from "next/link";
import { EnvelopeSimple, Phone, MapPin, ArrowRight } from "@phosphor-icons/react";
import { useLanguage } from "@/app/providers";

export default function SiteFooter() {
  const { t, locale } = useLanguage();
  const navLinks = [
    { href: "/", label: locale === "ar" ? "الرئيسية" : "Home" },
    { href: "/search", label: t.search.title },
    { href: "/about", label: t.aboutUs.title },
    { href: "/account", label: t.guestAccount.title },
  ];
  const year = new Date().getFullYear();
  const phoneHref = `tel:${t.contact.info.phone.replace(/[^+\d]/g, "")}`;
  const emailHref = `mailto:${t.contact.info.email}`;

  return (
    <footer id="contact" className="on-dark relative scroll-mt-24 overflow-hidden bg-surface-dark">
      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4b878' fill-rule='evenodd'%3E%3Cpath d='M30 0l15 15-15 15-15-15zM30 30l15 15-15 15-15-15z'/%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: "60px 60px" }} aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-surface-dark" />

      {/* Gold top border */}
      <div className="relative z-10 h-1 bg-gradient-to-r from-gold-deep via-gold-bright to-gold-deep" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Contact */}
          <div>
            <span className="eyebrow on-dark">{t.contact.eyebrow}</span>
            <h2 className="display-sm mt-5 font-display text-on-dark">{t.contact.title}</h2>
            <div className="ornament mt-4 justify-start"><span className="ornament-diamond" /></div>
            <p className="mt-4 max-w-md text-on-dark-muted">{t.contact.subtitle}</p>

            <div className="mt-8 space-y-4">
              <a href={emailHref} className="group flex min-h-11 items-center gap-3 text-on-dark-muted transition-colors hover:text-gold-bright">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/25 transition-colors group-hover:border-gold"><EnvelopeSimple size={18} className="text-gold-bright" weight="light" aria-hidden /></span>
                {t.contact.info.email}
              </a>
              <a href={phoneHref} className="group flex min-h-11 items-center gap-3 text-on-dark-muted transition-colors hover:text-gold-bright">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/25 transition-colors group-hover:border-gold"><Phone size={18} className="text-gold-bright" weight="light" aria-hidden /></span>
                {t.contact.info.phone}
              </a>
              <p className="flex min-h-11 items-center gap-3 text-on-dark-muted">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/25"><MapPin size={18} className="text-gold-bright" weight="light" aria-hidden /></span>
                {t.contact.info.address}
              </p>
            </div>
          </div>

          {/* Newsletter */}
          <div className="lg:ps-8">
            <h3 className="font-display text-lg font-bold text-on-dark">{t.footer.newsletter}</h3>
            <p className="mt-2 max-w-sm text-sm text-on-dark-muted">{locale === "ar" ? "اشترك لتصلك عروض وإقامات حصرية من سوار الأندلس." : "Subscribe for exclusive offers and stays from Sewar AlAndalus."}</p>
            <form className="mt-5 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => e.preventDefault()} aria-label={t.footer.newsletter}>
              <label htmlFor="newsletter-email" className="sr-only">{locale === "ar" ? "بريدك الإلكتروني" : "Your email"}</label>
              <input id="newsletter-email" type="email" required placeholder={locale === "ar" ? "بريدك الإلكتروني" : "Your email"} className="field flex-1 bg-white/5 text-on-dark placeholder:text-on-dark/40" autoComplete="email" />
              <button type="submit" className="btn btn-primary shrink-0">{t.footer.newsletterCta}<ArrowRight size={14} weight="bold" className="rtl:rotate-180" aria-hidden /></button>
            </form>

            <div className="mt-8 border-t border-gold/15 pt-6">
              <span className="font-display text-xl font-bold text-gold-bright">{t.brand.name}</span>
              <p className="mt-2 max-w-sm text-sm text-on-dark/50">{t.footer.about}</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-5 border-t border-gold/15 pt-8 md:flex-row">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Footer">
            {navLinks.map((link) => <Link key={link.href} href={link.href} className="min-h-11 flex items-center font-kufi text-sm text-on-dark-muted transition-colors hover:text-gold-bright">{link.label}</Link>)}
          </nav>
          <p className="font-kufi text-xs text-on-dark/40">© {year} {t.brand.name}. {t.footer.rights}.</p>
        </div>
      </div>
    </footer>
  );
}
