"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { atelierMedia } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";

const STARTS = [
  {
    key: "startUpload" as const,
    href: "/model-yukle" as Route,
    image: atelierMedia.startUpload,
  },
  {
    key: "startReady" as const,
    href: "/hazir-modeller" as Route,
    image: atelierMedia.startReady,
  },
  {
    key: "startShop" as const,
    href: "/magaza" as Route,
    image: atelierMedia.startShop,
  },
  {
    key: "startWholesale" as const,
    href: "/toptan" as Route,
    image: atelierMedia.startWholesale,
  },
];

export function StudioIntro() {
  const t = useTranslations();
  return (
    <section
      id="atolye"
      data-home-theme="abyss"
      className="atelier-panel atelier-start"
      aria-labelledby="studio-heading"
    >
      <div className="hi-shell atelier-shell">
        <p className="atelier-num">01</p>
        <p className="atelier-kicker">{t("home.atelier01Kicker")}</p>
        <h2 id="studio-heading" className="atelier-title">
          {t("home.atelier01Title")}
        </h2>
        <p className="atelier-lede">{t("home.atelier01Lede")}</p>
        <ul className="atelier-start-list">
          {STARTS.map((item) => (
            <li key={item.key}>
              <Link href={item.href} className="atelier-start-card">
                <span>
                  <strong>{t(`home.${item.key}Title`)}</strong>
                  <em>{t(`home.${item.key}Copy`)}</em>
                </span>
                <span className="atelier-start-media">
                  <SlotImage src={item.image} alt="" fill sizes="140px" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
