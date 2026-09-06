const ITEMS = [
  { title: "Güvenli ödeme", copy: "Ödeme altyapısı ve sipariş kaydı ayrı tutulur." },
  { title: "Gerçek üretim verisi", copy: "Fiyat, dilimleme çıktısı olmadan vaat edilmez." },
  { title: "Kontrollü üretim", copy: "Dosya, lisans ve geometri kontrol edilir." },
  { title: "Şeffaf fiyatlandırma", copy: "KDV ayrıdır. 100 TL kargo sipariş başına bir kez." },
] as const;

export function TrustStrip() {
  return (
    <section id="guven" data-home-theme="mono" className="hi-section" aria-labelledby="trust-heading">
      <div className="hi-shell">
        <h2 id="trust-heading" className="sr-only">
          Güven unsurları
        </h2>
        <ul className="grid grid-cols-2 gap-px border border-[color:var(--bc-line)] md:grid-cols-4">
          {ITEMS.map((item) => (
            <li key={item.title} className="bg-[color:var(--bc-panel)] p-4">
              <p className="hi-path-name text-[1rem]">{item.title}</p>
              <p className="mt-2 text-sm leading-5 text-[color:var(--bc-muted)]">{item.copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
