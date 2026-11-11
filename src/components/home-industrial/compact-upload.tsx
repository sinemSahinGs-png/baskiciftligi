"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { atelierMedia } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { trackHomeEvent } from "@/lib/home/analytics";

const DETAILS = ["detailMaterials", "detailSurface", "detailPrecision"] as const;

export function CompactUpload() {
  const t = useTranslations();
  return (
    <section
      id="sana-gore-hazir-modeller"
      data-home-theme="abyss"
      className="atelier-panel atelier-details"
      aria-labelledby="upload-invite-heading"
    >
      <div className="hi-shell atelier-shell">
        <p className="atelier-num">04</p>
        <p className="atelier-kicker">{t("home.atelier04Kicker")}</p>
        <h2 id="upload-invite-heading" className="atelier-title">
          {t("home.atelier04Title")}
        </h2>
        <p className="atelier-lede">{t("home.atelier04Lede")}</p>
        <div className="atelier-details-grid">
          <ul className="atelier-detail-cards">
            {DETAILS.map((key) => (
              <li key={key}>
                <strong>{t(`home.${key}Title`)}</strong>
                <p>{t(`home.${key}Copy`)}</p>
              </li>
            ))}
          </ul>
          <div className="atelier-details-media">
            <div className="atelier-object">
              <SlotImage src={atelierMedia.detailFilament} alt="" fill sizes="280px" />
            </div>
            <div className="atelier-object">
              <SlotImage src={atelierMedia.detailNozzle} alt="" fill sizes="280px" />
            </div>
          </div>
        </div>
        <Link
          href={"/model-yukle" as Route}
          className="atelier-cta"
          data-quote-cta=""
          onClick={() => trackHomeEvent({ name: "upload_cta_clicked" })}
        >
          {t("home.atelierUploadCta")}
        </Link>
      </div>
    </section>
  );
}
