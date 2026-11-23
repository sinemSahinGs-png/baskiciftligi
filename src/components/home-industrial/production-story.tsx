"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";

import { industrialAssets } from "@/components/home-industrial/industrial-slots";
import { SlotImage } from "@/components/home-industrial/slot-image";

const STEPS = [
  {
    key: "story1" as const,
    image: industrialAssets.heroWireframeVase,
    kind: "wire",
  },
  {
    key: "story2" as const,
    image: industrialAssets.pathUploadObject,
    kind: "price",
  },
  {
    key: "story3" as const,
    image: industrialAssets.featuredProduct,
    kind: "print",
  },
] as const;

function SceneVisual({
  kind,
  image,
  active,
}: {
  kind: (typeof STEPS)[number]["kind"];
  image: string;
  active: boolean;
}) {
  return (
    <div className="octo-story-visual" data-kind={kind} data-active={active ? "true" : "false"}>
      <span className="octo-story-visual-grid" />
      <span className="octo-story-visual-object">
        <SlotImage src={image} alt="" fill sizes="(max-width: 767px) 78vw, 420px" />
      </span>
      {kind === "wire" ? (
        <span className="octo-story-upload">
          <span>STL</span>
          <b>YÜKLENİYOR</b>
        </span>
      ) : null}
      {kind === "price" ? (
        <ul className="octo-story-facts">
          <li>PLA</li>
          <li>120 mm</li>
          <li>FDM</li>
        </ul>
      ) : null}
      {kind === "print" ? <span className="octo-story-printlines" data-active="true" /> : null}
      {kind === "print" ? <span className="octo-story-sandcap" /> : null}
    </div>
  );
}

export function ProductionStory() {
  const t = useTranslations();
  const reduce = useReducedMotion() === true;
  const rootRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const shownStep = reduce ? 2 : step;

  useEffect(() => {
    if (reduce) return;
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
      { threshold: [0.35, 0.55, 0.75], rootMargin: "-12% 0px -28% 0px" },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [reduce]);

  return (
    <section
      ref={rootRef}
      id="uc-uretim-yolu"
      data-home-theme="umber"
      data-octo-zone="atelier"
      data-octo-story-step={String(shownStep)}
      className="octo-band octo-band-umber octo-story"
      aria-labelledby="story-heading"
    >
      <div className="hi-shell octo-band-shell">
        <div className="octo-story-head">
          <h2 id="story-heading" className="octo-band-title octo-band-title-light">
            {t("home.storyTitle")}
          </h2>
          <p className="octo-story-index" data-story-index="">
            {String(shownStep + 1).padStart(2, "0")} / 03
          </p>
        </div>
        <div className="octo-story-layout">
          <div className="octo-story-stage" data-step={String(shownStep)} aria-hidden="true">
            {STEPS.map((item, index) => (
              <SceneVisual
                key={item.key}
                kind={item.kind}
                image={item.image}
                active={shownStep === index}
              />
            ))}
          </div>
          <ol className="octo-story-steps">
            {STEPS.map((item, index) => (
              <li
                key={item.key}
                data-story-step=""
                data-active={shownStep === index ? "true" : "false"}
              >
                <div className="octo-story-mobile-visual">
                  <SceneVisual kind={item.kind} image={item.image} active />
                </div>
                <span className="octo-story-num">{String(index + 1).padStart(2, "0")}</span>
                <div className="octo-story-copy">
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
