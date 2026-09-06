import type { Route } from "next";

import { HomeTrackLink } from "@/components/home/home-track-link";

const STEPS = [
  {
    id: "01",
    title: "STL / 3MF YÜKLE",
    copy: "Dosya güvenle yüklenir. STL ve 3MF kabul edilir; 3MF içindeki yazdırılabilir geometri ayrılır.",
  },
  {
    id: "02",
    title: "PRUSASLICER ANALİZİ",
    copy: "Gerçek geometri PrusaSlicer 2.8.1 ile dilimlenir. Gram ve baskı süresi tahmini üretilmez, ölçülür.",
  },
  {
    id: "03",
    title: "GERÇEK FİYATINI GÖR",
    copy: "Aktif tarife ve imzalı formül uygulanır. KDV ayrıdır. 100 TL kargo sipariş başına bir kez eklenir.",
  },
] as const;

export function QuoteFlow() {
  return (
    <section
      id="modelin-hazir-mi"
      data-home-theme="mono"
      className="hi-section"
      aria-labelledby="quote-heading"
    >
      <div className="hi-shell">
        <h2 id="quote-heading" className="hi-title max-w-[14ch]">
          DOSYANI YÜKLE, FİYATINI ÖĞREN
        </h2>
        <div className="mt-6 grid gap-px border border-[color:var(--bc-line)] md:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.id} className="bg-[color:var(--bc-panel)] p-4">
              <p className="hi-mono">
                {step.id}
              </p>
              <h3 className="hi-path-name mt-3">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--bc-muted)]">{step.copy}</p>
            </article>
          ))}
        </div>
        <HomeTrackLink
          event="upload_cta_clicked"
          href={"/model-yukle" as Route}
          className="hi-btn mt-5"
        >
          Modelini yükle →
        </HomeTrackLink>
      </div>
    </section>
  );
}
