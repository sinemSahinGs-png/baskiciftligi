"use client";

import type { Route } from "next";
import { useTranslations } from "next-intl";

import { mineralCutouts } from "@/components/home-industrial/industrial-slots";
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
          <span className="octo-wholesale-cave" aria-hidden="true" />
          <span className="octo-wholesale-media" data-wholesale-dragon="" aria-hidden="true">
            <SlotImage
              src={mineralCutouts.wholesaleDragon}
              alt=""
              fill
              priority
              className="object-contain"
              sizes="(max-width: 767px) 48vw, 24vw"
            />
          </span>
          <span className="octo-wholesale-shadow" aria-hidden="true" />
          <span className="octo-wholesale-sand" aria-hidden="true" />
          <span className="octo-wholesale-ridge" aria-hidden="true" />
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
