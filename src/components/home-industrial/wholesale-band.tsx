"use client";

import type { Route } from "next";
import { useTranslations } from "next-intl";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { MagneticAction, WordReveal } from "@/components/motion/premium";

export function WholesaleBand() {
  const t = useTranslations();
  return (
    <section
      id="toptan-bayiler"
      data-home-theme="mono"
      className="hi-section hi-wholesale"
      aria-labelledby="wholesale-heading"
    >
      <div className="hi-shell hi-wholesale-layout">
        <p className="hi-kicker">{t("home.wholesaleKicker")}</p>
        <WordReveal
          as="h2"
          id="wholesale-heading"
          className="hi-title max-w-[14ch]"
          text={t("home.wholesaleTitle")}
        />
        <p className="hi-lede">
          {t("home.wholesaleLede")}
        </p>
        <div className="hi-wholesale-actions">
          <MagneticAction className="w-fit">
            <HomeTrackLink
              event="corporate_cta_clicked"
              href={"/toptan" as Route}
              className="hi-btn"
            >
              {t("home.wholesaleCta")}
            </HomeTrackLink>
          </MagneticAction>
          <HomeTrackLink
            href={"/toptan/katalog" as Route}
            className="hi-link"
          >
            {t("home.wholesaleCatalog")}
          </HomeTrackLink>
        </div>
      </div>
    </section>
  );
}
