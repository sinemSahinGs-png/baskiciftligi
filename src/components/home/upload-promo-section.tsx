"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { trackHomeEvent } from "@/lib/home/analytics";

const advantages = [
  "STL ve 3MF desteği",
  "Gerçek PrusaSlicer analizi",
  "Anlık imzalı teklif",
] as const;

export function UploadPromoSection() {
  const [open, setOpen] = useState(false);

  return (
    <section
      id="modelin-hazir-mi"
      className="relative overflow-hidden bg-[#10141c] text-light-text"
    >
      <FoundryGrid variant="fade" className="opacity-40" />
      <div className="home-shell relative grid items-center gap-8 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-violet uppercase">
            Dijital model
          </p>
          <h2
            id="modelin-hazir-mi-baslik"
            className="mt-3 font-heading text-[1.65rem] leading-[1.08] font-bold tracking-[-0.04em] sm:text-3xl"
          >
            Modelini ürüne dönüştür
          </h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/70">
            Dosyanı yükle. Üretim öncesi kontrol ve imzalı teklif, gerçek dilimlemeden sonra gelir.
          </p>
          <ul className="mt-5 space-y-2 text-sm">
            {advantages.map((item) => (
              <li key={item} className="flex min-h-11 items-center gap-2">
                <span className="size-1.5 rounded-full bg-cyan" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href={"/model-yukle" as Route}
            onClick={() => trackHomeEvent({ name: "upload_cta_clicked" })}
            className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-orange px-5 text-sm font-semibold text-midnight"
          >
            Dosyanı yükle
          </Link>
          <button
            type="button"
            className="mt-3 block min-h-11 text-left text-sm font-semibold text-white/70 underline-offset-4 hover:underline"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            Nasıl hesaplanıyor?
          </button>
          {open ? (
            <p className="mt-2 max-w-md text-sm leading-6 text-white/65">
              Teklif; katman süresi, malzeme gramı ve `bc-quote-v2` formülünden üretilir.
              Dosya analiz edilmeden fiyat gösterilmez.
            </p>
          ) : null}
        </div>
        <div className="relative min-h-64 overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f16]">
          <FoundryGrid variant="measure" />
          <div
            aria-hidden="true"
            className="absolute inset-10 rounded-2xl border border-dashed border-cyan/30"
          />
          <p className="absolute bottom-5 left-5 text-xs tracking-[0.16em] text-cyan/80">
            STL · 3MF · Üretim öncesi kontrol
          </p>
        </div>
      </div>
    </section>
  );
}
