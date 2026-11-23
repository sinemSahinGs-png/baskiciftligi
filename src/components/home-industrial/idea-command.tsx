"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRef } from "react";
import { useReducedMotion } from "motion/react";

import "./octo-sand-hero.css";
import { HeroVideo } from "@/components/home-industrial/hero-video";
import { OctoInteractiveSandHero } from "@/components/home-industrial/octo-interactive-sand-hero";
import { MagneticAction, WordReveal, useHeroPointer } from "@/components/motion/premium";
import {
  OCTO_TV_MOBILE_MEDIA,
  OCTO_TV_SHELL,
  OCTO_TV_SOURCE,
} from "@/lib/hero-sand/tv-screen";
import { trackHomeEvent } from "@/lib/home/analytics";
import { useTranslations } from "next-intl";

export function IdeaCommand() {
  const t = useTranslations();
  const sectionRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion() === true;
  useHeroPointer(sectionRef);

  return (
    <section
      ref={sectionRef}
      id="ne-uretmek-istiyorsun"
      data-home-theme="sand"
      className="hi-hero octo-tv-hero"
      aria-labelledby="idea-command-heading"
    >
      <div className="octo-tv-stage">
        <OctoInteractiveSandHero />
        <div className="octo-tv-frame">
          <picture className="octo-tv-shell-picture">
            <source
              media={OCTO_TV_MOBILE_MEDIA}
              srcSet={OCTO_TV_SHELL.mobile}
              type="image/webp"
            />
            <source
              media="(min-width: 768px)"
              srcSet={OCTO_TV_SHELL.desktop}
              type="image/webp"
            />
            <img
              className="octo-tv-shell"
              src={OCTO_TV_SOURCE.path}
              alt=""
              width={OCTO_TV_SOURCE.width}
              height={OCTO_TV_SOURCE.height}
              decoding="async"
              fetchPriority="high"
            />
          </picture>
          <div className="octo-tv-screen" data-octo-tv-screen="">
            <HeroVideo reducedMotion={reduceMotion} />
            <div className="octo-tv-glass" aria-hidden="true" />
          </div>
          <div className="octo-tv-content">
            <div className="hi-hero-inner">
              <div className="hi-hero-cluster">
                <div className="hi-hero-copy">
                  <p className="hi-kicker">{t("home.heroKicker")}</p>
                  <WordReveal
                    as="h1"
                    id="idea-command-heading"
                    className="hi-hero-display"
                    text={t("home.heroTitle")}
                  />
                  <span className="hi-hero-rule" aria-hidden="true" />
                  <p className="hi-hero-lede">{t("home.heroLede")}</p>
                  <div className="octo-hero-actions">
                    <MagneticAction>
                      <Link href={"/magaza" as Route} className="octo-cta">
                        {t("home.heroPrimary")}
                      </Link>
                    </MagneticAction>
                    <MagneticAction>
                      <Link
                        href={"/model-yukle" as Route}
                        onClick={() => trackHomeEvent({ name: "upload_cta_clicked" })}
                        className="octo-cta-ghost"
                      >
                        {t("home.heroSecondary")}
                      </Link>
                    </MagneticAction>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
