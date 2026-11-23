"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { HomeTrackLink } from "@/components/home/home-track-link";
import { storefrontCategoryAsset } from "@/domain/catalog/storefront-taxonomy";

export function StartPath() {
  const t = useTranslations();

  return (
    <section
      id="nereden-baslamali"
      data-home-theme="copper"
      data-octo-zone="atelier"
      className="octo-band octo-band-copper octo-portals"
      aria-labelledby="start-path-heading"
    >
      <div className="hi-shell octo-band-shell">
        <h2 id="start-path-heading" className="octo-band-title octo-band-title-light hi-title">
          {t("home.startPathTitle")}
        </h2>
        <div className="octo-chambers">
          <article className="octo-chamber octo-chamber-sand" data-portal="file">
            <div className="octo-chamber-stage">
              <span className="octo-chamber-grid" aria-hidden="true" />
              <span className="octo-chamber-object octo-chamber-wire" data-portal-layer="wire">
                <SlotImage
                  src={industrialAssets.heroWireframeVase}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 88vw, 42vw"
                />
              </span>
              <span className="octo-chamber-material" data-portal-layer="material" aria-hidden="true" />
              <span className="octo-chamber-object octo-chamber-finish" data-portal-layer="finish">
                <SlotImage
                  src={industrialAssets.featuredProduct}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 88vw, 42vw"
                />
              </span>
              <span className="octo-chamber-sandbed" aria-hidden="true" />
              <span className="octo-chamber-veil" data-octo-portal-veil="file" />
            </div>
            <div className="octo-chamber-copy">
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
          <article className="octo-chamber octo-chamber-rock" data-portal="find">
            <div className="octo-chamber-stage">
              <span className="octo-chamber-mineral" aria-hidden="true" />
              <span className="octo-chamber-object octo-chamber-find" data-octo-portal-object="find">
                <SlotImage
                  src={storefrontCategoryAsset("dekorasyon-yasam")}
                  alt=""
                  fill
                  sizes="(max-width: 767px) 88vw, 42vw"
                />
              </span>
              <span className="octo-chamber-sandbed octo-chamber-sandbed-thin" aria-hidden="true" />
              <span className="octo-chamber-veil octo-chamber-veil-mineral" data-octo-portal-veil="find" />
            </div>
            <div className="octo-chamber-copy">
              <h3>{t("home.startFindTitle")}</h3>
              <p>{t("home.startFindCopy")}</p>
              <Link href={"/hazir-modeller" as Route} className="octo-start-cta octo-start-cta-ghost">
                {t("home.startFindCta")}
              </Link>
            </div>
          </article>
        </div>
        <p className="octo-start-links">
          <Link href={"/iletisim" as Route}>{t("home.startIdeaLink")}</Link>
          <Link href={"/toptan" as Route}>{t("home.startWholesaleLink")}</Link>
        </p>
      </div>
    </section>
  );
}
