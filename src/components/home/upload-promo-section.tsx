"use client";

import type { Route } from "next";
import Link from "next/link";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { RevealBlock } from "@/components/motion/reveal-copy";
import { RevealCopy } from "@/components/motion/reveal-copy";
import { RevealHeading } from "@/components/motion/reveal-words";

const formats = ["STL", "3MF", "OBJ", "100 MB"] as const;

export function UploadPromoSection() {
  return (
    <section
      id="modelin-hazir-mi"
      className="relative overflow-hidden bg-midnight text-light-text"
    >
      <FoundryGrid variant="fade" />
      <div className="shell relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="eyebrow">Dijital üretim kokpiti</p>
          <RevealHeading
            id="modelin-hazir-mi-baslik"
            text="Modelin hazır mı?"
            className="section-title stack-title text-light-text"
          />
          <RevealCopy
            text="STL, 3MF veya OBJ bırak. Dilimleme bağlı değil; kesin fiyat değerlendirmeden sonra bildirilir."
            className="stack-body max-w-xl text-[1.05rem] leading-7 text-muted-light"
          />
          <RevealBlock delay={0.12} className="mt-8">
            <Link
              href={"/model-yukle" as Route}
              className="inline-flex min-h-12 items-center rounded-md bg-cobalt px-6 text-sm font-semibold text-light-text"
            >
              Model yükle
            </Link>
          </RevealBlock>
        </div>
        <RevealBlock className="relative min-h-72 overflow-hidden rounded-xl border border-white/10 bg-carbon">
          <FoundryGrid variant="measure" />
          <div
            aria-hidden="true"
            className="motion-measure-box absolute inset-8 border border-dashed border-cyan/35"
          />
          <div
            aria-hidden="true"
            className="motion-measure-shape absolute top-1/2 left-1/2 h-36 w-44 -translate-x-1/2 -translate-y-1/2 border border-cyan/80 [clip-path:polygon(50%_0,100%_28%,82%_100%,18%_100%,0_28%)]"
          />
          <span className="absolute top-6 left-6 text-xs tracking-[0.18em] text-cyan/80">
            X
          </span>
          <span className="absolute top-6 right-6 text-xs tracking-[0.18em] text-cyan/80">
            Y
          </span>
          <span className="absolute bottom-16 left-6 text-xs tracking-[0.18em] text-cyan/80">
            Z
          </span>
          <p className="absolute bottom-5 left-5 flex flex-wrap gap-2 text-xs text-muted-light">
            {formats.map((format, index) => (
              <span key={format}>
                {format}
                {index < formats.length - 1 ? " ·" : null}
              </span>
            ))}
          </p>
        </RevealBlock>
      </div>
    </section>
  );
}
