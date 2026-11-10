"use client";

import { useTranslations } from "next-intl";

export function StudioIntro() {
  const t = useTranslations();
  return (
    <section
      id="atolye"
      data-home-theme="ivory"
      className="octo-story octo-story-ivory octo-studio"
      aria-labelledby="studio-heading"
    >
      <div className="hi-shell octo-studio-grid">
        <h2 id="studio-heading" className="octo-serif">
          {t("home.studioTitle")}
        </h2>
        <div>
          <p className="octo-studio-lede">{t("home.studioLede")}</p>
          <span className="octo-copper-rule" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
