"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";

const BEATS = [
  { key: "story1" as const, src: industrialAssets.heroWireframeVase },
  { key: "story2" as const, src: industrialAssets.pathUploadObject },
  { key: "story3" as const, src: industrialAssets.printerFarm },
] as const;

const LOOP_MS = 14000;

export function ProductionStory() {
  const t = useTranslations();
  const reduce = useReducedMotion() === true;
  const [step, setStep] = useState(reduce ? 2 : 0);
  const shownStep = reduce ? 2 : step;

  useEffect(() => {
    if (reduce) {
      setStep(2);
      return;
    }
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const phase = ((now - started) % LOOP_MS) / LOOP_MS;
      setStep(phase < 0.34 ? 0 : phase < 0.68 ? 1 : 2);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reduce]);

  return (
    <section
      id="uc-uretim-yolu"
      data-home-theme="umber"
      data-octo-zone="atelier"
      data-octo-story-step={String(shownStep)}
      className="octo-band octo-story octo-order-film is-revealed"
      aria-labelledby="story-heading"
    >
      <div className="hi-shell octo-band-shell">
        <div className="octo-story-head">
          <h2 id="story-heading" className="octo-band-title octo-band-title-light">
            {t("home.storyTitle")}
          </h2>
        </div>
        <p className="octo-order-film-lede">{t("home.storyFilmLede")}</p>

        <div className="octo-story-mobile-visual octo-order-frame">
          <div className="octo-story-visual octo-story-beats-stage" aria-hidden="true">
            {BEATS.map((item, index) => (
              <div
                key={item.key}
                className="octo-story-beat-art"
                data-active={shownStep === index ? "true" : "false"}
              >
                <SlotImage
                  src={item.src}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="(max-width: 767px) 88vw, 640px"
                />
              </div>
            ))}
          </div>
        </div>

        <ol className="octo-order-beats">
          {BEATS.map((item, index) => (
            <li
              key={item.key}
              data-story-step=""
              data-story-end={index === BEATS.length - 1 ? "" : undefined}
              data-active={shownStep === index ? "true" : "false"}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div className="octo-story-copy">
                <h3>{t(`home.${item.key}Title`)}</h3>
                <p>{t(`home.${item.key}Copy`)}</p>
              </div>
            </li>
          ))}
        </ol>

        <Link href={"/model-yukle" as Route} className="octo-start-cta octo-order-film-cta">
          {t("home.startFileCta")}
        </Link>
      </div>
    </section>
  );
}
