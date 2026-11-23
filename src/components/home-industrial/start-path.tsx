"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { SlotImage } from "@/components/home-industrial/slot-image";
import { storefrontCategoryAsset } from "@/domain/catalog/storefront-taxonomy";
import { HomeTrackLink } from "@/components/home/home-track-link";

export function StartPath() {
  const t = useTranslations();

  return (
    <section
      id="nereden-baslamali"
      data-home-theme="copper"
      className="octo-band octo-band-copper"
      aria-labelledby="start-path-heading"
    >
      <div className="hi-shell octo-band-shell">
        <h2 id="start-path-heading" className="octo-band-title octo-band-title-light">
          {t("home.startPathTitle")}
        </h2>
        <ul className="octo-portal-grid">
          <li>
            <article className="octo-portal" data-reveal="sand-wipe">
              <span className="octo-portal-media" aria-hidden="true">
                <SlotImage
                  src={storefrontCategoryAsset("kisiye-ozel")}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 92vw, 46vw"
                />
              </span>
              <div className="octo-portal-copy">
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
            <article className="octo-portal" data-reveal="mineral">
              <span className="octo-portal-media" aria-hidden="true">
                <SlotImage
                  src={storefrontCategoryAsset("dekorasyon-yasam")}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 92vw, 46vw"
                />
              </span>
              <div className="octo-portal-copy">
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
