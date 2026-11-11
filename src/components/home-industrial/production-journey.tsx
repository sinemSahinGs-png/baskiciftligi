"use client";

import { useTranslations } from "next-intl";

import { atelierMedia } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";

const STEPS = ["atelierStep1", "atelierStep2", "atelierStep3"] as const;

export function ProductionJourney() {
  const t = useTranslations();
  return (
    <section
      id="uc-uretim-yolu"
      data-home-theme="abyss"
      className="atelier-panel atelier-steps"
      aria-labelledby="journey-heading"
    >
      <div className="hi-shell atelier-shell atelier-steps-grid">
        <div>
          <p className="atelier-num">02</p>
          <p className="atelier-kicker">{t("home.atelier02Kicker")}</p>
          <h2 id="journey-heading" className="atelier-title">
            {t("home.atelier02Title")}
          </h2>
          <p className="atelier-lede">{t("home.atelier02Lede")}</p>
          <ol className="atelier-step-list">
            {STEPS.map((key, index) => (
              <li key={key}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{t(`home.${key}Title`)}</strong>
                  <p>{t(`home.${key}Copy`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="atelier-steps-visual">
          <div className="atelier-object">
            <SlotImage src={atelierMedia.stepHero} alt="" fill sizes="(max-width: 767px) 70vw, 380px" />
          </div>
          <div className="atelier-steps-row">
            <div className="atelier-object atelier-object-wide">
              <SlotImage src={atelierMedia.stepPrinter} alt="" fill sizes="220px" />
            </div>
            <div className="atelier-pack">
              <SlotImage src={atelierMedia.packBox} alt="" fill sizes="160px" />
              <p>OCTO STUDIO</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
