import type { Route } from "next";

import { HomeTrackLink } from "@/components/home/home-track-link";

const STEPS = [
  {
    id: "01",
    title: "STL / 3MF YÜKLE",
    copy: "STL ve 3MF kabul edilir.",
  },
  {
    id: "02",
    title: "PRUSASLICER ANALİZİ",
    copy: "Gerçek geometri dilimlenir.",
  },
  {
    id: "03",
    title: "GERÇEK FİYATINI GÖR",
    copy: "İmzalı tarife. Sahte fiyat yok.",
  },
] as const;

export function QuoteFlow() {
  return (
    <section
      id="modelin-hazir-mi"
      data-home-theme="inverse"
      className="hi-section hi-inverse"
      aria-labelledby="quote-heading"
    >
      <div className="hi-shell">
        <h2 id="quote-heading" className="hi-title max-w-[12ch]">
          DOSYANI YÜKLE, FİYATINI ÖĞREN
        </h2>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <article key={step.id}>
              <p className="hi-quote-num">{step.id}</p>
              <h3 className="hi-path-name mt-2">{step.title}</h3>
              <p className="mt-1 text-sm leading-5 text-[color:var(--bc-muted)]">{step.copy}</p>
            </article>
          ))}
        </div>
        <HomeTrackLink
          event="upload_cta_clicked"
          href={"/model-yukle" as Route}
          className="hi-btn mt-6"
        >
          Modelini yükle →
        </HomeTrackLink>
      </div>
    </section>
  );
}
