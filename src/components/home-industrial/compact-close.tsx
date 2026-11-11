"use client";

import { faqItems } from "@/components/home/faq-data";
import { RESIN_SPECIMEN_SRC } from "@/components/home-industrial/industrial-slots";
import { useTranslations } from "next-intl";

export function CompactClose() {
  const t = useTranslations();
  const trust = [
    { title: t("home.trust1Title"), copy: t("home.trust1Copy") },
    { title: t("home.trust2Title"), copy: t("home.trust2Copy") },
    { title: t("home.trust3Title"), copy: t("home.trust3Copy") },
  ];
  const faqs = faqItems.slice(0, 3);

  return (
    <section
      id="guven"
      data-home-theme="abyss"
      className="atelier-panel atelier-close"
      aria-labelledby="trust-heading"
    >
      <div className="hi-shell atelier-shell">
        <h2 id="trust-heading" className="atelier-title atelier-title-sm">
          {t("home.trustHeading")}
        </h2>
        <ul className="atelier-trust">
          {trust.map((item) => (
            <li key={item.title}>
              <p>{item.title}</p>
              <p>{item.copy}</p>
            </li>
          ))}
        </ul>

        <aside
          id="malzeme-secenekleri"
          className="hi-material-info octo-resin-note atelier-resin"
          data-material-info="resin"
        >
          <p className="hi-material-info-kicker">Bilgi</p>
          <h3>Reçine örneği</h3>
          <p>
            Bu görüntü örnek bir reçine yüzeyidir. Otomatik üretim ve fiyat
            hesaplarında Reçine seçeneği yoktur; ödeme tutarına eklenmez.
          </p>
          <div className="hi-material-info-frame">
            <img
              src={RESIN_SPECIMEN_SRC}
              alt="Reçine yüzey örneği, bilgi amaçlı"
              width={1600}
              height={1200}
            />
          </div>
        </aside>

        <div id="sik-sorulanlar" className="atelier-faq">
          <h2 id="faq-heading" className="atelier-title atelier-title-sm">
            {t("home.faqTitle")}
          </h2>
          {faqs.map((item, index) => (
            <details key={item.id} className="atelier-faq-item">
              <summary>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {t(`faq.${item.id}.q`)}
              </summary>
              <p>{t(`faq.${item.id}.a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
