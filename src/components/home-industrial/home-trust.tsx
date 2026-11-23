"use client";

import { useTranslations } from "next-intl";

export function HomeTrust() {
  const t = useTranslations();
  const items = [
    { title: t("home.trustAnkaraTitle"), copy: t("home.trustAnkaraCopy") },
    { title: t("home.trustPriceTitle"), copy: t("home.trustPriceCopy") },
    { title: t("home.trustOrderTitle"), copy: t("home.trustOrderCopy") },
  ];

  return (
    <section
      id="guven"
      data-home-theme="void"
      className="octo-band octo-band-void"
      aria-labelledby="trust-heading"
    >
      <div className="hi-shell octo-band-shell">
        <h2 id="trust-heading" className="sr-only">
          {t("home.trustHeading")}
        </h2>
        <ul className="octo-trust-grid">
          {items.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
