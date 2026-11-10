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
      className="octo-story octo-close"
      aria-labelledby="trust-heading"
    >
      <div className="hi-shell">
        <h2 id="trust-heading" className="octo-serif octo-serif-on-dark">
          {t("home.trustHeading")}
        </h2>
        <ul className="octo-trust-grid">
          {trust.map((item) => (
            <li key={item.title}>
              <p>{item.title}</p>
              <p>{item.copy}</p>
            </li>
          ))}
        </ul>

        <aside
          id="malzeme-secenekleri"
          className="hi-material-info octo-resin-note"
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

        <div id="sik-sorulanlar" className="octo-close-faq">
          <h2 id="faq-heading" className="octo-serif octo-serif-on-dark">
            {t("home.faqTitle")}
          </h2>
          {faqs.map((item, index) => (
            <details key={item.id} className="octo-faq-item">
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
