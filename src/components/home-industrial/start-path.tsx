"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { atelierMedia } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { HomeTrackLink } from "@/components/home/home-track-link";

export function StartPath() {
  const t = useTranslations();

  return (
    <section
      id="nereden-baslamali"
      data-home-theme="ivory"
      className="octo-band octo-band-ivory"
      aria-labelledby="start-path-heading"
    >
      <div className="hi-shell octo-band-shell">
        <h2 id="start-path-heading" className="octo-band-title">
          {t("home.startPathTitle")}
        </h2>
        <ul className="octo-start-grid">
          <li>
            <article className="octo-start-card">
              <span className="octo-start-media" aria-hidden="true">
                <SlotImage
                  src={atelierMedia.startUpload}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 92vw, 420px"
                />
              </span>
              <div className="octo-start-copy">
                <h3>{t("home.startFileTitle")}</h3>
                <p>{t("home.startFileCopy")}</p>
                <HomeTrackLink
                  event="upload_cta_clicked"
                  href={"/model-yukle" as Route}
                  className="octo-start-cta"
                >
                  {t("home.startFileCta")}
                </HomeTrackLink>
              </div>
            </article>
          </li>
          <li>
            <article className="octo-start-card">
              <span className="octo-start-media" aria-hidden="true">
                <SlotImage
                  src={atelierMedia.startReady}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 92vw, 420px"
                />
              </span>
              <div className="octo-start-copy">
                <h3>{t("home.startFindTitle")}</h3>
                <p>{t("home.startFindCopy")}</p>
                <Link href={"/hazir-modeller" as Route} className="octo-start-cta octo-start-cta-ghost">
                  {t("home.startFindCta")}
                </Link>
              </div>
            </article>
          </li>
        </ul>
        <p className="octo-start-links">
          <Link href={"/iletisim" as Route}>{t("home.startIdeaLink")}</Link>
          <Link href={"/toptan" as Route}>{t("home.startWholesaleLink")}</Link>
        </p>
      </div>
    </section>
  );
}
