"use client";

import type { Route } from "next";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";

import { ModelConsultationModal } from "@/components/models/model-consultation-modal";
import { PricingStatusBlock } from "@/components/models/pricing-status-block";
import {
  PrintProductionOptions,
  type ProductionOptionsValue,
} from "@/components/models/print-production-options";
import { QuoteCtaButton } from "@/components/models/quote-cta-button";
import { SafeImage } from "@/components/media/safe-image";
import { communityModelPricing } from "@/domain/external-models/pricing-state";
import type { ExternalModelSummary } from "@/providers/contracts";
import { cn } from "@/lib/utils";

export function ThingiverseDetail({ model }: { model: ExternalModelSummary }) {
  const [productionOptions, setProductionOptions] = useState<ProductionOptionsValue>({
    material: "pla",
    color: "beyaz",
    sizePreset: "orta",
    quantity: 1,
  });
  const [requestOpen, setRequestOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);

  const pricing = useMemo(() => communityModelPricing(), []);

  const images = useMemo(() => {
    const urls = new Set<string>();
    if (model.thumbnailUrl) urls.add(model.thumbnailUrl);
    for (const url of model.imageUrls ?? []) {
      if (url) urls.add(url);
    }
    return [...urls];
  }, [model.thumbnailUrl, model.imageUrls]);
  const [activeImage, setActiveImage] = useState(images[0] ?? null);

  return (
    <main id="ana-icerik" className="relative pb-28 text-light-text lg:pb-10">
      <article className="shell relative py-8 sm:py-10">
        <Link
          href={"/hazir-modeller" as Route}
          className="text-sm text-muted-light transition hover:text-light-text"
        >
          ← Hazır modeller
        </Link>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:gap-10">
          <div className="min-w-0 space-y-4">
            <div className="relative aspect-square max-h-[min(72vh,42rem)] overflow-hidden rounded-2xl bg-midnight/70">
              {activeImage ? (
                <SafeImage
                  src={activeImage}
                  alt={model.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-contain p-6"
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-light">
                  Görsel yok
                </div>
              )}
            </div>
            {images.length > 1 ? (
              <ul className="flex gap-2 overflow-x-auto pb-1">
                {images.map((url) => (
                  <li key={url} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveImage(url)}
                      className={cn(
                        "relative size-16 overflow-hidden rounded-lg border transition",
                        activeImage === url ? "border-coral" : "border-white/10",
                      )}
                    >
                      <SafeImage src={url} alt="" fill sizes="64px" className="object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <aside className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
            <div>
              <h1 className="font-heading text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                {model.title}
              </h1>
              <p className="mt-2 text-sm text-muted-light">
                Tasarımcı: {model.creatorName}
              </p>
            </div>

            <PrintProductionOptions
              value={productionOptions}
              onChange={setProductionOptions}
            />

            <PricingStatusBlock pricing={pricing} />

            <div className="hidden lg:block space-y-3">
              <QuoteCtaButton onClick={() => setRequestOpen(true)} />
              <p className="text-xs leading-5 text-muted-light">
                Seçimlerini gönder, üretim detaylarını inceleyip net teklifimizi paylaşalım.
              </p>
              <a
                href={model.sourceUrl}
                rel="noreferrer"
                target="_blank"
                className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-light transition hover:text-light-text"
              >
                Orijinal modeli görüntüle
                <ExternalLink aria-hidden="true" className="size-3.5" />
              </a>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02]">
              <button
                type="button"
                aria-expanded={techOpen}
                onClick={() => setTechOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
              >
                Teknik model bilgisi
                <ChevronDown
                  aria-hidden="true"
                  className={cn("size-4 transition", techOpen && "rotate-180")}
                />
              </button>
              {techOpen ? (
                <dl className="space-y-2 border-t border-white/10 px-4 py-3 text-xs text-muted-light">
                  <div className="flex justify-between gap-4">
                    <dt>Kaynak</dt>
                    <dd className="text-right text-light-text">Topluluk</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Model ID</dt>
                    <dd className="text-right text-light-text">{model.externalId}</dd>
                  </div>
                  {model.fileCount != null ? (
                    <div className="flex justify-between gap-4">
                      <dt>Dosya sayısı</dt>
                      <dd className="text-right text-light-text">{model.fileCount}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </div>
          </aside>
        </div>
      </article>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-carbon/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
        <QuoteCtaButton onClick={() => setRequestOpen(true)} />
        <p className="mt-2 text-center text-[11px] leading-4 text-muted-light">
          Seçimlerini gönder, net teklifimizi paylaşalım.
        </p>
      </div>

      <ModelConsultationModal
        open={requestOpen}
        onOpenChange={setRequestOpen}
        model={{
          source: model.source,
          externalId: model.externalId,
          title: model.title,
          creatorName: model.creatorName,
          sourceUrl: model.sourceUrl,
          licenseLabel: model.licenseLabel,
          licenseCode: model.licenseCode,
          thumbnailUrl: model.thumbnailUrl,
        }}
        productionOptions={productionOptions}
        pricingState={pricing.state}
      />
    </main>
  );
}
