import type { Route } from "next";

import { HomeTrackLink } from "@/components/home/home-track-link";

const advantages = [
  "STL ve 3MF desteği",
  "Gerçek PrusaSlicer analizi",
  "Anlık imzalı teklif",
] as const;

const pipeline = [
  { label: "STL / 3MF" },
  { label: "PrusaSlicer" },
  { label: "gram / süre" },
  { label: "imzalı fiyat" },
] as const;

export function UploadPromoSection() {
  return (
    <section id="modelin-hazir-mi" className="home-section relative overflow-hidden">
      <div className="home-shell relative grid items-center gap-7 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-[0.8125rem] font-semibold tracking-[0.14em] text-[#c9b8ff] uppercase">
            Dijital model
          </p>
          <h2 id="modelin-hazir-mi-baslik" className="home-title home-mask-reveal mt-2">
            Modelini ürüne dönüştür
          </h2>
          <p className="home-lede">
            Dosyanı yükle. Üretim öncesi kontrol ve imzalı teklif, gerçek dilimlemeden sonra gelir.
          </p>
          <ul className="mt-4 space-y-1.5 text-base leading-7 text-white/80">
            {advantages.map((item) => (
              <li key={item} className="flex min-h-10 items-center gap-2">
                <span className="size-1.5 rounded-full bg-cyan" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <HomeTrackLink
            event="upload_cta_clicked"
            href={"/model-yukle" as Route}
            className="home-cta-press mt-5 inline-flex min-h-12 items-center rounded-xl bg-orange px-5 text-[0.9375rem] font-semibold text-midnight"
          >
            Dosyanı yükle
          </HomeTrackLink>
          <details className="mt-2">
            <summary className="min-h-11 cursor-pointer list-none text-left text-[0.875rem] font-semibold text-white/75 underline-offset-4 hover:underline [&::-webkit-details-marker]:hidden">
              Nasıl hesaplanıyor?
            </summary>
            <p className="mt-1 max-w-md text-base leading-7 text-white/75">
              Teklif; katman süresi, malzeme gramı ve `bc-quote-v2` formülünden üretilir.
              Dosya analiz edilmeden fiyat gösterilmez.
            </p>
          </details>
        </div>
        <div className="home-card relative overflow-hidden p-5 sm:p-6" aria-hidden="true">
          <p className="text-[0.8125rem] font-semibold tracking-[0.14em] text-cyan uppercase">
            Üretim hattı
          </p>
          <svg viewBox="0 0 320 92" className="mt-4 h-auto w-full text-cyan">
            <path
              d="M18 46 H302"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="home-pipeline-line"
              opacity="0.85"
            />
            {pipeline.map((node, index) => (
              <g key={node.label} transform={`translate(${18 + index * 94} 46)`}>
                <circle
                  r="8"
                  fill="#0c1014"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="home-pipeline-node"
                />
              </g>
            ))}
          </svg>
          <ol className="mt-2 grid grid-cols-4 gap-2 text-center">
            {pipeline.map((node) => (
              <li
                key={node.label}
                className="home-pipeline-node text-[0.8125rem] leading-5 font-semibold text-white/85"
              >
                {node.label}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
