"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";

import { OctopusTentacle } from "@/components/brand/octopus-tentacle";

const STEPS = [
  { key: "journey1" as const, href: "/magaza" as Route },
  { key: "journey2" as const, href: "/model-yukle" as Route },
  { key: "journey3" as const, href: "/model-yukle" as Route },
  { key: "journey4" as const, href: "/odeme" as Route },
];

export function ProductionJourney() {
  const t = useTranslations();
  return (
    <section
      id="uc-uretim-yolu"
      data-home-theme="abyss"
      className="octo-story octo-journey"
      aria-labelledby="journey-heading"
    >
      <div className="hi-shell">
        <p className="hi-kicker">OCTO STUDIO</p>
        <h2 id="journey-heading" className="octo-serif octo-serif-on-dark">
          {t("home.journeyTitle")}
        </h2>
        <div className="octo-journey-track">
          <OctopusTentacle variant="journey" className="octo-journey-tentacle" />
          <ol className="octo-journey-steps">
            {STEPS.map((step, index) => (
              <li key={step.key}>
                <Link href={step.href} className="octo-journey-step">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{t(`home.${step.key}`)}</strong>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
