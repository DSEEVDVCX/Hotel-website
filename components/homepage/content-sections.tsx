"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { Star, ShieldCheck, Clock, Tag, Headset, ForkKnife, Path, Sparkle } from "@phosphor-icons/react";
import { useLanguage } from "@/app/providers";
import { useRef } from "react";

export default function ContentSections() {
  const { t, locale } = useLanguage();
  const expRef = useRef<HTMLElement>(null);
  const { scrollYProgress: expProgress } = useScroll({ target: expRef, offset: ["start end", "end start"] });
  const expImgScale = useTransform(expProgress, [0, 0.5], [0.85, 1.05]);
  const expImgOpacity = useTransform(expProgress, [0, 0.3, 0.7, 1], [0.4, 1, 1, 0.3]);

  const trustSignals = [
    { icon: ShieldCheck, ar: "حجز آمن", en: "Secure Booking", arDesc: "دفع مشفّر وحماية كاملة", enDesc: "Encrypted payments, full protection" },
    { icon: Clock, ar: "إلغاء مجاني", en: "Free Cancellation", arDesc: "مرونة في الإلغاء حسب السياسة", enDesc: "Flexible cancellation per policy" },
    { icon: Tag, ar: "أفضل الأسعار", en: "Best Prices", arDesc: "ضمان أفضل سعر متاح", enDesc: "Best available price guarantee" },
    { icon: Headset, ar: "دعم 24/7", en: "24/7 Support", arDesc: "فريق دعم متواجد دائماً", enDesc: "Always-available support team" },
  ];

  const expIcons = [Sparkle, ForkKnife, Path, Headset];

  return (
    <>
      {/* Stats band — emerald with gold numerals */}
      <section className="relative border-y border-gold/20 bg-primary py-16 lg:py-20">
        <div className="ambient-glow ambient-gold h-[400px] w-[600px] top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-2 lg:grid-cols-4">
          {t.stats.items.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.07, ease: [0.2, 0, 0, 1] }}
              className={`px-5 py-6 text-center ${i < t.stats.items.length - 1 ? "border-gold/20 lg:border-e" : ""} ${i % 2 === 0 ? "border-b lg:border-b-0" : ""}`}
            >
              <p className="font-display text-4xl font-bold text-gold-bright md:text-6xl" style={{ fontVariantNumeric: "tabular-nums" }}>{s.prefix}{s.value}{s.suffix}</p>
              <p className="mt-2 font-kufi text-xs font-medium uppercase tracking-wide text-on-dark/75">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Experiences — image scale/fade on scroll */}
      <section id="experiences" ref={expRef} className="scroll-mt-24 section-pad">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
          {/* Image with scroll-driven scale & fade */}
          <div className="overflow-hidden rounded-2xl border border-gold/30 shadow-lg">
            <motion.img
              style={{ scale: expImgScale, opacity: expImgOpacity }}
              src="https://picsum.photos/seed/sewar-spa-moroccan-hammam-luxury/800/1000"
              alt={locale === "ar" ? "تجارب استثنائية" : "Exceptional Experiences"}
              className="aspect-[4/5] w-full object-cover img-elegant"
              loading="lazy" decoding="async"
            />
          </div>

          {/* Content — no meta-labels, clean list */}
          <div>
            <span className="eyebrow">{t.experiences.eyebrow}</span>
            <h2 className="display-sm mt-5 font-display text-primary">{locale === "ar" ? "تجارب استثنائية" : "Exceptional Experiences"}</h2>
            <div className="ornament mt-4 justify-start"><span className="ornament-diamond" /></div>
            <p className="mb-7 mt-4 max-w-lg text-on-surface-muted">{locale === "ar" ? "من المنتجعات الصحية الفاخرة إلى المطاعم الذواقة، نقدّم تجارب لا تُنسى تتجاوز توقعاتك." : "From luxury spa retreats to fine dining restaurants, we offer unforgettable experiences that exceed your expectations."}</p>
            <div className="space-y-1">
              {t.experiences.items.map((exp, i) => {
                const Icon = expIcons[i % expIcons.length];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08, ease: [0.2, 0, 0, 1] }}
                    className="group flex items-center gap-3 rounded-xl border border-transparent p-3 transition-colors duration-300 hover:border-gold/30 hover:bg-gold-glint/50"
                    style={{ transitionTimingFunction: "var(--ease-standard)" }}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-primary-tint transition-transform duration-300 group-hover:scale-110" style={{ transitionTimingFunction: "var(--ease-standard)" }}>
                      <Icon size={20} className="text-gold-deep" weight="light" aria-hidden />
                    </div>
                    <span className="font-display text-lg font-bold text-primary">{exp.title}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Why choose us — centered, no meta-labels */}
      <section id="why" className="scroll-mt-24 bg-surface-muted section-pad">
        <div className="mx-auto max-w-6xl px-5 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }} className="mb-14 text-center">
            <span className="eyebrow">{t.hotelHome.trustSignals}</span>
            <h2 className="display-sm mt-5 font-display text-primary">{locale === "ar" ? "لماذا تختار سوار الأندلس" : "Why Choose Sewar AlAndalus"}</h2>
            <div className="ornament mt-5"><span className="ornament-diamond" /></div>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustSignals.map((ts, i) => {
              const Icon = ts.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease: [0.2, 0, 0, 1] }}
                  className="card group p-7 text-center"
                >
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-gold/20 bg-primary-tint transition-transform duration-300 group-hover:scale-110" style={{ transitionTimingFunction: "var(--ease-standard)" }}>
                    <Icon size={26} className="text-gold-deep" weight="light" aria-hidden />
                  </div>
                  <h3 className="font-display text-base font-bold text-primary">{locale === "ar" ? ts.ar : ts.en}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-muted">{locale === "ar" ? ts.arDesc : ts.enDesc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Guest stories — dark with ambient glows */}
      <section id="stories" className="on-dark relative scroll-mt-24 overflow-hidden bg-surface-dark section-pad">
        <div className="ambient-glow ambient-emerald h-[500px] w-[500px] top-[5%] start-[10%]" />
        <div className="ambient-glow ambient-gold h-[400px] w-[400px] bottom-[10%] end-[5%]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4b878' fill-rule='evenodd'%3E%3Cpath d='M30 0l15 15-15 15-15-15zM30 30l15 15-15 15-15-15z'/%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: "60px 60px" }} aria-hidden />
        <div className="relative z-10 mx-auto max-w-6xl px-5 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }} className="mb-14 text-center">
            <span className="eyebrow on-dark">{t.testimonials.eyebrow}</span>
            <h2 className="display-sm mt-5 font-display text-on-dark">{locale === "ar" ? "قصص ضيوفنا" : "Guest Stories"}</h2>
            <div className="ornament mt-5"><span className="ornament-diamond" /></div>
          </motion.div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {t.testimonials.items.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.2, 0, 0, 1] }}
                className="rounded-2xl border border-gold/20 bg-surface-dark/60 p-7 backdrop-blur-sm"
              >
                <div className="mb-4 flex gap-0.5 text-gold-bright" aria-label="5 stars">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={14} weight="fill" aria-hidden />)}
                </div>
                <blockquote className="mb-5 text-lg leading-relaxed text-on-dark/90">&ldquo;{item.quote}&rdquo;</blockquote>
                <div className="border-t border-gold/15 pt-4">
                  <p className="font-display font-bold text-on-dark">{item.name}</p>
                  <p className="mt-0.5 font-kufi text-sm text-gold-bright">{item.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
