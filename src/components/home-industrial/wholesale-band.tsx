"use client";

import type { Route } from "next";
import { useTranslations } from "next-intl";

import { OctopusTentacle } from "@/components/brand/octopus-tentacle";
import { HomeTrackLink } from "@/components/home/home-track-link";

export function WholesaleBand() {
  const t = useTranslations();
  return (
    <section
      id="toptan-bayiler"
      data-home-theme="mono"
      className="octo-story octo-wholesale"
      aria-labelledby="wholesale-heading"
    >
      <OctopusTentacle variant="wholesale" className="octo-wholesale-tentacle" />
      <div className="hi-shell octo-wholesale-layout">
        <h2 id="wholesale-heading" className="octo-serif octo-serif-on-dark">
          {t("home.wholesaleBannerTitle")}
        </h2>
        <p className="hi-lede" style={{ color: "rgb(240 233 218 / 0.82)" }}>
          {t("home.wholesaleBannerLede")}
        </p>
        <div className="hi-wholesale-actions">
          <HomeTrackLink
            event="corporate_cta_clicked"
            href={"/toptan" as Route}
            className="hi-btn"
          >
            {t("home.wholesaleReach")}
          </HomeTrackLink>
        </div>
      </div>
    </section>
  );
}
