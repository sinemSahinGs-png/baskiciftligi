"use client";

import type { Route } from "next";
import { useTranslations } from "next-intl";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { MagneticAction, WordReveal } from "@/components/motion/premium";

export function FinalCta() {
  const t = useTranslations();
  return (
    <section id="basla" data-home-theme="mono" className="hi-section hi-final" aria-labelledby="final-heading">
      <div className="hi-shell">
        <WordReveal as="h2" id="final-heading" className="hi-title" text={t("home.finalTitle")} />
        <p className="hi-lede">{t("home.finalLede")}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <MagneticAction className="w-fit">
            <HomeTrackLink
              event="upload_cta_clicked"
              href={"/model-yukle" as Route}
              className="hi-btn"
            >
              {t("home.quoteCta")}
            </HomeTrackLink>
          </MagneticAction>
          <HomeTrackLink
            event="corporate_cta_clicked"
            href={"/kurumsal-teklif" as Route}
            className="hi-btn hi-btn-ghost"
          >
            {t("home.finalCorporate")}
          </HomeTrackLink>
        </div>
      </div>
    </section>
  );
}
