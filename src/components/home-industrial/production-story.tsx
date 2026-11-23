"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { OCTO_SAND_FIELD } from "@/lib/hero-sand/tv-screen";

const STEPS = [
  { key: "story1" as const, image: industrialAssets.heroWireframeVase },
  { key: "story2" as const, image: industrialAssets.pathUploadObject },
  { key: "story3" as const, image: industrialAssets.featuredProduct },
] as const;

export function ProductionStory() {
  const t = useTranslations();
  const reduce = useReducedMotion() === true;
  const rootRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const shownStep = reduce ? 2 : step;

  useEffect(() => {
    if (reduce) {
      return;
    }
    const root = rootRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll("[data-story-step]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const index = nodes.indexOf(visible?.target as Element);
        if (index >= 0) setStep(index);
      },
      { threshold: [0.35, 0.6], rootMargin: "-20% 0px -35% 0px" },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [reduce]);

  return (
    <section
      ref={rootRef}
      id="uc-uretim-yolu"
      data-home-theme="umber"
      className="octo-band octo-band-umber octo-story"
      aria-labelledby="story-heading"
    >
      <div className="hi-shell octo-band-shell">
        <h2 id="story-heading" className="octo-band-title octo-band-title-light">
          {t("home.storyTitle")}
        </h2>
        <div className="octo-story-layout">
          <div className="octo-story-stage" data-step={String(shownStep)} aria-hidden="true">
            <span className="octo-story-sand">
              <SlotImage src={OCTO_SAND_FIELD} alt="" fill sizes="(max-width: 767px) 92vw, 520px" />
            </span>
            {STEPS.map((item, index) => (
              <span
                key={item.key}
                className="octo-story-object"
                data-active={shownStep >= index ? "true" : "false"}
                data-layer={index}
              >
                <SlotImage src={item.image} alt="" fill sizes="(max-width: 767px) 70vw, 380px" />
              </span>
            ))}
            <span className="octo-story-printlines" data-active={shownStep >= 1 ? "true" : "false"} />
            <span className="octo-story-tentacle" data-active={shownStep >= 2 ? "true" : "false"} />
          </div>
          <ol className="octo-story-steps">
            {STEPS.map((item, index) => (
              <li key={item.key} data-story-step="" data-active={shownStep === index ? "true" : "false"}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{t(`home.${item.key}Title`)}</h3>
                  <p>{t(`home.${item.key}Copy`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
