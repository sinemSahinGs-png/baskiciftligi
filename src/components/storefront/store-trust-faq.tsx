import { faqItems } from "@/components/home/faq-data";

const TRUST = [
  "Güvenli ödeme",
  "Kontrollü üretim",
  "Türkiye’de üretim",
  "Şeffaf fiyatlandırma",
] as const;

export function StoreTrustFaq() {
  const items = faqItems.slice(0, 4);

  return (
    <section className="store-trust-faq" aria-labelledby="store-trust-heading">
      <h2 id="store-trust-heading" className="sr-only">
        Güven ve sorular
      </h2>
      <ul className="store-trust">
        {TRUST.map((item) => (
          <li key={item}>
            <p>{item}</p>
          </li>
        ))}
      </ul>
      <div className="shell store-faq">
        {items.map((item) => (
          <details key={item.id}>
            <summary>
              {item.question}
              <span aria-hidden="true">+</span>
            </summary>
            <p className="pb-4 text-sm leading-6 text-[color:var(--store-muted-dark)]">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
