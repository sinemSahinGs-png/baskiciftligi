"use client";

import type { Route } from "next";
import { useTranslations } from "next-intl";

import { atelierMedia } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { HomeTrackLink } from "@/components/home/home-track-link";

export function WholesaleBand() {
  const t = useTranslations();
  return (
    <section
      id="toptan-bayiler"
      data-home-theme="abyss"
      className="atelier-panel atelier-split"
      aria-labelledby="wholesale-heading"
    >
      <div className="hi-shell atelier-shell">
        <p className="atelier-num">05</p>
        <p className="atelier-kicker">{t("home.atelier05Kicker")}</p>
        <h2 id="wholesale-heading" className="atelier-title">
          {t("home.atelier05Title")}
        </h2>
        <div className="atelier-split-grid">
          <article className="atelier-split-card">
            <div className="atelier-object">
              <SlotImage src={atelierMedia.personal} alt="" fill sizes="(max-width: 767px) 80vw, 420px" />
            </div>
            <h3>{t("home.personalTitle")}</h3>
            <p>{t("home.personalCopy")}</p>
            <HomeTrackLink event="upload_cta_clicked" href={"/model-yukle" as Route} className="atelier-cta">
              {t("home.personalCta")}
            </HomeTrackLink>
          </article>
          <article className="atelier-split-card">
            <div className="atelier-object">
              <SlotImage src={atelierMedia.corporate} alt="" fill sizes="(max-width: 767px) 80vw, 420px" />
            </div>
            <h3>{t("home.corpTitle")}</h3>
            <p>{t("home.corpCopy")}</p>
            <HomeTrackLink event="corporate_cta_clicked" href={"/toptan" as Route} className="atelier-cta-ghost">
              {t("home.corpCta")}
            </HomeTrackLink>
          </article>
        </div>
      </div>
    </section>
  );
}
