"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";

export function TrustStrip() {
  const t = useTranslations();
  const ITEMS = [
    { title: t("home.trust1Title"), copy: t("home.trust1Copy") },
    { title: t("home.trust2Title"), copy: t("home.trust2Copy") },
    { title: t("home.trust3Title"), copy: t("home.trust3Copy") },
    { title: t("home.trust4Title"), copy: t("home.trust4Copy") },
  ];

  return (
    <section id="guven" data-home-theme="mono" className="hi-section" aria-labelledby="trust-heading">
      <div className="hi-shell">
        <h2 id="trust-heading" className="sr-only">
          {t("home.trustHeading")}
        </h2>
        <ul className="grid grid-cols-2 gap-px border border-[color:var(--bc-line)] md:grid-cols-4">
          {ITEMS.map((item, index) => (
            <li
              key={item.title}
              className="hi-trust-cell bg-[color:var(--bc-panel)] p-4"
              style={{ "--cell-i": index } as CSSProperties}
            >
              <p className="hi-path-name text-[1rem]">{item.title}</p>
              <p className="mt-2 text-sm leading-5 text-[color:var(--bc-muted)]">{item.copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
