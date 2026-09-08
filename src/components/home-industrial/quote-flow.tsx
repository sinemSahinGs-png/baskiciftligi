import type { Route } from "next";
import type { CSSProperties } from "react";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { storePremiumAssets } from "@/components/storefront/store-premium-assets";
import { SlotImage } from "@/components/home-industrial/slot-image";
import { InteractiveMedia, MagneticAction, TechnicalDivider, WordReveal } from "@/components/motion/premium";

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
      className="hi-section hi-inverse hi-quote"
      aria-labelledby="quote-heading"
    >
      <div className="hi-shell hi-quote-layout">
        <div>
          <WordReveal
            as="h2"
            id="quote-heading"
            className="hi-title max-w-[14ch]"
            text="DOSYANI YÜKLE, FİYATINI ÖĞREN"
          />
          <TechnicalDivider className="mt-5" />
          <ol className="hi-quote-steps">
            {STEPS.map((step, index) => (
              <li key={step.id} data-quote-step={step.id} style={{ "--step-i": index } as CSSProperties}>
                <p className="hi-quote-num">{step.id}</p>
                <h3 className="hi-path-name mt-2">{step.title}</h3>
                <p className="mt-1 text-sm leading-5 text-[color:var(--bc-muted)]">{step.copy}</p>
              </li>
            ))}
          </ol>
          <MagneticAction className="mt-4 w-fit">
            <HomeTrackLink
              event="upload_cta_clicked"
              href={"/model-yukle" as Route}
              className="hi-btn"
            >
              Modelini yükle →
            </HomeTrackLink>
          </MagneticAction>
        </div>
        <InteractiveMedia className="hi-quote-media" data-industrial-asset="path-upload-object">
          <SlotImage
            src={storePremiumAssets.uploadObject}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 42vw"
            className="object-cover object-[72%_center]"
          />
        </InteractiveMedia>
      </div>
    </section>
  );
}
