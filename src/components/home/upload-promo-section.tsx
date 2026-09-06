"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { trackHomeEvent } from "@/lib/home/analytics";

const advantages = [
  "STL ve 3MF desteği",
  "Gerçek PrusaSlicer analizi",
  "Anlık imzalı teklif",
] as const;

const pipeline = [
  { label: "STL / 3MF", delay: "0ms" },
  { label: "PrusaSlicer", delay: "120ms" },
  { label: "gram / süre", delay: "240ms" },
  { label: "imzalı fiyat", delay: "360ms" },
] as const;

export function UploadPromoSection() {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const graphicRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = graphicRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

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
          <Link
            href={"/model-yukle" as Route}
            onClick={() => trackHomeEvent({ name: "upload_cta_clicked" })}
            className="home-cta-press mt-5 inline-flex min-h-12 items-center rounded-xl bg-orange px-5 text-[0.9375rem] font-semibold text-midnight"
          >
            Dosyanı yükle
          </Link>
          <button
            type="button"
            className="mt-2 block min-h-11 text-left text-[0.875rem] font-semibold text-white/75 underline-offset-4 hover:underline"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            Nasıl hesaplanıyor?
          </button>
          {open ? (
            <p className="mt-1 max-w-md text-base leading-7 text-white/75">
              Teklif; katman süresi, malzeme gramı ve `bc-quote-v2` formülünden üretilir.
              Dosya analiz edilmeden fiyat gösterilmez.
            </p>
          ) : null}
        </div>
        <div
          ref={graphicRef}
          className="home-card relative overflow-hidden p-5 sm:p-6"
          aria-hidden="true"
        >
          <p className="text-[0.8125rem] font-semibold tracking-[0.14em] text-cyan uppercase">
            Üretim hattı
          </p>
          <svg viewBox="0 0 320 92" className="mt-4 h-auto w-full text-cyan">
            <path
              d="M18 46 H302"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={visible ? "home-pipeline-line" : ""}
              opacity="0.85"
            />
            {pipeline.map((node, index) => (
              <g key={node.label} transform={`translate(${18 + index * 94} 46)`}>
                <circle
                  r="8"
                  fill="#0c1014"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={visible ? "home-pipeline-node" : ""}
                  style={{ animationDelay: node.delay }}
                />
              </g>
            ))}
          </svg>
          <ol className="mt-2 grid grid-cols-4 gap-2 text-center">
            {pipeline.map((node) => (
              <li
                key={node.label}
                className={visible ? "home-pipeline-node text-[0.8125rem] leading-5 font-semibold text-white/85" : "text-[0.8125rem] leading-5 font-semibold text-white/85"}
                style={{ animationDelay: node.delay }}
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
