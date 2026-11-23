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
      data-home-theme="void"
      data-octo-zone="commerce"
      className="octo-band octo-band-void"
      aria-labelledby="wholesale-heading"
    >
      <div className="hi-shell octo-band-shell">
        <article className="octo-wholesale octo-wholesale-chamber">
          <span className="octo-wholesale-sand" aria-hidden="true" />
          <span className="octo-wholesale-scale" aria-hidden="true" />
          <span className="octo-wholesale-media" aria-hidden="true">
            <SlotImage
              src={atelierMedia.corporate}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, 1100px"
            />
          </span>
          <div className="octo-wholesale-copy">
            <h2 id="wholesale-heading">{t("home.wholesalePlanTitle")}</h2>
            <p>{t("home.wholesalePlanCopy")}</p>
            <HomeTrackLink
              event="corporate_cta_clicked"
              href={"/toptan" as Route}
              className="octo-start-cta"
            >
              {t("home.wholesalePlanCta")}
            </HomeTrackLink>
          </div>
        </article>
      </div>
    </section>
  );
}
