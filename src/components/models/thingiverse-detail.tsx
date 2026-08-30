"use client";

import type { Route } from "next";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktopLayout(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

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
    <main
      id="ana-icerik"
      className={cn(
        "relative text-light-text lg:pb-10",
        !requestOpen && "pb-[calc(5rem+env(safe-area-inset-bottom))]",
      )}
    >
      <article className="relative px-4 py-6 sm:px-5 lg:shell lg:py-10">
        <Link
          href={"/hazir-modeller" as Route}
          className="inline-flex min-h-11 items-center text-sm text-muted-light transition hover:text-light-text"
        >
          ← Hazır modeller
        </Link>

        <div className="mt-5 space-y-5 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] lg:items-start lg:gap-10">
          <section className="min-w-0 space-y-3 lg:space-y-4">
            <div className="relative mx-auto aspect-square w-full max-h-[min(60svh,28rem)] overflow-hidden rounded-2xl bg-midnight/70 lg:max-h-[min(62svh,42rem)]">
              {activeImage ? (
                <SafeImage
                  src={activeImage}
                  alt={model.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-contain p-4 sm:p-6"
                  fallbackLabel="Görsel yakında"
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-light">
                  Görsel yakında
                </div>
              )}
            </div>
            {images.length > 1 ? (
              <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {images.map((url) => (
                  <li key={url} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveImage(url)}
                      aria-label="Görsel seç"
                      className={cn(
                        "relative size-14 overflow-hidden rounded-lg border-2 transition sm:size-[3.75rem]",
                        activeImage === url ? "border-coral" : "border-white/10",
                      )}
                    >
                      <SafeImage src={url} alt="" fill sizes="60px" className="object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          <aside className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
            <header className="space-y-1">
              <h1 className="font-heading text-[clamp(1.625rem,5.5vw,2rem)] font-bold leading-tight tracking-[-0.03em] lg:text-4xl">
                {model.title}
              </h1>
              <p className="text-sm leading-5 text-muted-light">
                Tasarımcı: {model.creatorName}
              </p>
            </header>

            <PrintProductionOptions
              value={productionOptions}
              onChange={setProductionOptions}
            />

            <PricingStatusBlock pricing={pricing} />

            <p className="text-sm leading-6 text-muted-light lg:hidden">
              Seçimlerini gönder, üretim detaylarını inceleyip net teklifimizi paylaşalım.
            </p>

            <div className="rounded-xl border border-white/10 bg-white/[0.02]">
              <button
                type="button"
                aria-expanded={techOpen}
                onClick={() => setTechOpen((prev) => !prev)}
                className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
              >
                Teknik model bilgisi
                <ChevronDown
                  aria-hidden="true"
                  className={cn("size-4 transition", techOpen && "rotate-180")}
                />
              </button>
              {techOpen ? (
                <dl className="space-y-2 border-t border-white/10 px-4 py-3 text-sm text-muted-light">
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

            <a
              href={model.sourceUrl}
              rel="noreferrer"
              target="_blank"
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-light transition hover:text-light-text lg:hidden"
            >
              Orijinal modeli görüntüle
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>

            {isDesktopLayout ? (
              <div className="space-y-3">
                <QuoteCtaButton onClick={() => setRequestOpen(true)} />
                <p className="text-sm leading-6 text-muted-light">
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
            ) : null}
          </aside>
        </div>
      </article>

      {!requestOpen && !isDesktopLayout ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-carbon/90 px-4 pt-3 backdrop-blur-md"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          data-mobile-sticky-cta=""
        >
          <QuoteCtaButton variant="sticky" onClick={() => setRequestOpen(true)} />
        </div>
      ) : null}

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
