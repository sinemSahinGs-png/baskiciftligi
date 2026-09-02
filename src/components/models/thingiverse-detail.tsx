"use client";

import type { Route } from "next";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ExternalModelPriceModal } from "@/components/models/external-model-price-modal";
import { ModelConsultationModal } from "@/components/models/model-consultation-modal";
import { ModelDetailGallery } from "@/components/models/model-detail-gallery";
import { PricingStatusBlock } from "@/components/models/pricing-status-block";
import {
  PrintProductionOptions,
  type ProductionOptionsValue,
} from "@/components/models/print-production-options";
import { QuoteCtaButton } from "@/components/models/quote-cta-button";
import { communityModelPricing } from "@/domain/external-models/pricing-state";
import type { ExternalQuoteModelContext } from "@/lib/models/external-quote-context";
import type { ExternalModelSummary } from "@/providers/contracts";
import { cn } from "@/lib/utils";

export function ThingiverseDetail({
  model,
  enrichmentNotice = null,
}: {
  model: ExternalModelSummary;
  enrichmentNotice?: string | null;
}) {
  const [productionOptions, setProductionOptions] = useState<ProductionOptionsValue>({
    material: "pla",
    color: "beyaz",
    sizePreset: "orta",
    quantity: 1,
  });
  const [uploadOpen, setUploadOpen] = useState(false);
  const [consultOpen, setConsultOpen] = useState(false);
  const [techOpen, setTechOpen] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const uploadCtaRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktopLayout(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const pricing = useMemo(() => communityModelPricing(), []);

  const originalSourceHref = `/api/hazir-modeller/source-open?kind=thingiverse&id=${encodeURIComponent(model.externalId)}`;

  const quoteContext = useMemo<ExternalQuoteModelContext>(
    () => ({
      externalModelId: model.externalId,
      sourceType: "thingiverse",
      sourceUrl: model.sourceUrl,
      title: model.title,
      categoryLabel: model.categoryLabel ?? null,
      previewImageUrl: model.thumbnailUrl ?? null,
      imageAlt: model.title,
      attribution: model.attributionText,
      licenseName: model.licenseCode ?? null,
      licenseVerified: Boolean(model.automaticManufacturingAllowed),
      platformLabel: "Thingiverse",
      productionOptions,
    }),
    [model, productionOptions],
  );

  const modalOpen = uploadOpen || consultOpen;

  return (
    <main
      id="ana-icerik"
      data-thingiverse-detail=""
      data-thingiverse-id={model.externalId}
      className={cn(
        "relative text-light-text lg:pb-10",
        !modalOpen && !isDesktopLayout && "pb-[calc(5rem+env(safe-area-inset-bottom))]",
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
          <section className="min-w-0">
            <ModelDetailGallery
              title={model.title}
              thumbnailUrl={model.thumbnailUrl}
              imageUrls={model.imageUrls}
              priority
            />
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

            {enrichmentNotice ? (
              <p
                data-detail-enrichment-notice=""
                className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm leading-5 text-muted-light"
              >
                {enrichmentNotice}
              </p>
            ) : null}

            <PricingStatusBlock pricing={pricing} />

            <p className="text-sm leading-6 text-muted-light lg:hidden">
              Model dosyasını yüklediğinde baskı süresi ve malzeme kullanımı analiz
              edilerek fiyat hesaplanır.
            </p>

            <button
              type="button"
              data-consultation-fallback=""
              className="text-sm font-semibold text-muted-light underline-offset-2 hover:text-light-text hover:underline lg:hidden"
              onClick={() => setConsultOpen(true)}
            >
              Dosyan yok mu? Yardım iste
            </button>

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
              href={originalSourceHref}
              rel="noreferrer"
              target="_blank"
              data-original-source-link=""
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted-light transition hover:text-light-text lg:hidden"
            >
              Orijinal modeli görüntüle
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>

            {isDesktopLayout ? (
              <div className="space-y-3">
                <QuoteCtaButton onClick={() => setUploadOpen(true)} />
                <button
                  type="button"
                  data-consultation-fallback=""
                  className="text-sm font-semibold text-muted-light underline-offset-2 hover:text-light-text hover:underline"
                  onClick={() => setConsultOpen(true)}
                >
                  Dosyan yok mu? Yardım iste
                </button>
                <p className="text-sm leading-6 text-muted-light">
                  Model dosyasını yüklediğinde baskı süresi ve malzeme kullanımı analiz
                  edilerek fiyat hesaplanır.
                </p>
                <a
                  href={originalSourceHref}
                  rel="noreferrer"
                  target="_blank"
                  data-original-source-link=""
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

      {!modalOpen && !isDesktopLayout ? (
        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-carbon/90 px-4 pt-3 backdrop-blur-md"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          data-mobile-sticky-cta=""
        >
          <QuoteCtaButton variant="sticky" onClick={() => setUploadOpen(true)} />
        </div>
      ) : null}

      <ExternalModelPriceModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        model={quoteContext}
        returnFocusRef={uploadCtaRef}
      />

      <ModelConsultationModal
        open={consultOpen}
        onOpenChange={setConsultOpen}
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
