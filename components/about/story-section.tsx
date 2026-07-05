"use client";

import { useLanguage } from "@/app/providers";

export default function StorySection() {
  const { t } = useLanguage();

  return (
    <div className="space-y-16 md:space-y-24">
      <header className="text-center">
        <h1 className="font-display text-4xl font-bold text-on-surface md:text-5xl">
          {t.aboutUs.title}
        </h1>
      </header>

      <section>
        <span className="eyebrow mb-6">{t.aboutUs.story}</span>
        <h2 className="font-display text-2xl font-semibold leading-tight text-on-surface md:text-3xl">
          {t.about.title}
        </h2>
        <p className="mt-6 max-w-[52ch] border-s-2 border-gold ps-5 text-lg font-medium leading-relaxed text-gold-deep">
          {t.about.lead}
        </p>
        <div className="mt-6 space-y-5">
          {t.about.paragraphs.map((p, i) => (
            <p
              key={i}
              className="max-w-[60ch] text-base leading-relaxed text-on-surface-muted"
            >
              {p}
            </p>
          ))}
        </div>
        <div className="mt-10 flex items-center gap-4 border-t border-border pt-6">
          <span className="h-9 w-9 bg-gold" style={{ borderRadius: 2 }} />
          <div>
            <p className="font-semibold text-on-surface">{t.about.signatory}</p>
            <p className="mt-0.5 text-sm text-on-surface-muted">{t.about.signature}</p>
          </div>
        </div>
      </section>

      <section>
        <span className="eyebrow mb-6">{t.aboutUs.vision}</span>
        <h2 className="font-display text-2xl font-semibold leading-tight text-on-surface md:text-3xl">
          {t.vision.title}
        </h2>
        <p className="mt-6 max-w-[60ch] text-base leading-relaxed text-on-surface-muted">
          {t.vision.body}
        </p>
        <div className="mt-8 border border-border bg-surface-muted p-6 md:p-8" style={{ borderRadius: 2 }}>
          <h3 className="font-display text-xl font-semibold text-gold-deep">
            {t.vision.mission.title}
          </h3>
          <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-on-surface-muted">
            {t.vision.mission.body}
          </p>
        </div>
      </section>

      <section>
        <span className="eyebrow mb-6">{t.aboutUs.values}</span>
        <h2 className="font-display text-2xl font-semibold leading-tight text-on-surface md:text-3xl">
          {t.values.title}
        </h2>
        <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-on-surface-muted">
          {t.values.subtitle}
        </p>
        <div className="mt-8 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2" style={{ borderRadius: 2 }}>
          {t.values.items.map((item, i) => (
            <div key={i} className="bg-surface-raised p-6 md:p-8">
              <span className="font-display text-sm font-semibold text-gold">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-lg font-semibold text-on-surface">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-muted">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
