"use client";

import type { CSSProperties } from "react";
import type { Route } from "next";
import Link from "next/link";

import { FormSignal } from "@/components/brand/form-signal";
import { FoundryGrid } from "@/components/brand/foundry-grid";
import { MotionScope } from "@/components/motion/motion-scope";
import { RevealCopy } from "@/components/motion/reveal-copy";
import { RevealHeading } from "@/components/motion/reveal-words";

const formats = ["STL", "3MF", "OBJ", "100 MB"] as const;

export function UploadPromoSection() {
  return (
    <section className="relative overflow-hidden bg-midnight text-light-text">
      <FoundryGrid variant="fade" />
      <MotionScope className="shell relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <p className="eyebrow" data-motion-line="idle">
            <span className="motion-line">Dijital üretim kokpiti</span>
          </p>
          <RevealHeading
            text="Modelin hazır mı?"
            className="section-title stack-title text-light-text"
          />
          <RevealCopy
            text="STL, 3MF veya OBJ bırak. Dilimleme bağlı değil; kesin fiyat değerlendirmeden sonra bildirilir."
            className="stack-body max-w-xl text-[1.05rem] leading-7 text-muted-light"
          />
          <Link
            href={"/model-yukle" as Route}
            data-motion-item="idle"
            className="motion-item mt-8 inline-flex min-h-12 items-center rounded-md bg-cobalt px-6 text-sm font-semibold text-light-text"
            style={{ "--motion-delay": "0.28s" } as CSSProperties}
          >
            Model yükle
          </Link>
        </div>
        <div
          data-motion-item="idle"
          className="motion-item relative min-h-72 overflow-hidden rounded-xl border border-white/10 bg-carbon"
        >
          <FoundryGrid variant="measure" />
          <div
            aria-hidden="true"
            className="motion-measure-box absolute inset-8 border border-dashed border-cyan/35"
          />
          <div
            aria-hidden="true"
            className="motion-measure-shape absolute top-1/2 left-1/2 h-36 w-44 -translate-x-1/2 -translate-y-1/2 border border-cyan/80 [clip-path:polygon(50%_0,100%_28%,82%_100%,18%_100%,0_28%)]"
          />
          <span className="motion-axis absolute top-6 left-6 text-xs tracking-[0.18em] text-cyan/80">
            X
          </span>
          <span
            className="motion-axis absolute top-6 right-6 text-xs tracking-[0.18em] text-cyan/80"
            style={{ "--motion-delay": "0.08s" } as CSSProperties}
          >
            Y
          </span>
          <span
            className="motion-axis absolute bottom-16 left-6 text-xs tracking-[0.18em] text-cyan/80"
            style={{ "--motion-delay": "0.16s" } as CSSProperties}
          >
            Z
          </span>
          <FormSignal spinning className="absolute top-6 right-16 size-8" />
          <p className="absolute bottom-5 left-5 flex flex-wrap gap-2 text-xs text-muted-light">
            {formats.map((format, index) => (
              <span
                key={format}
                data-motion-item="idle"
                className="motion-item"
                style={{ "--motion-delay": `${0.18 + index * 0.06}s` } as CSSProperties}
              >
                {format}
                {index < formats.length - 1 ? " ·" : null}
              </span>
            ))}
          </p>
        </div>
      </MotionScope>
    </section>
  );
}
