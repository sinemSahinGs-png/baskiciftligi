"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import { ModelConsultationModal } from "@/components/models/model-consultation-modal";
import {
  EstimatedPriceBlock,
  PrintProductionOptions,
  type ProductionOptionsValue,
} from "@/components/models/print-production-options";
import { ExternalModelPriceModal } from "@/components/models/external-model-price-modal";
import { SafeImage } from "@/components/media/safe-image";
import { resolveLicenseCommercePolicyFromLabel } from "@/domain/external-models/license-commerce";
import {
  labelForSourceType,
  type ExternalQuoteModelContext,
} from "@/lib/models/external-quote-context";
import type { ExternalModelSummary } from "@/providers/contracts";
import { cn } from "@/lib/utils";

function toQuoteContext(model: ExternalModelSummary): ExternalQuoteModelContext {
  return {
    externalModelId: model.externalId,
    sourceType: "thingiverse",
    sourceUrl: model.sourceUrl,
    title: model.title,
    categoryLabel: model.categoryLabel ?? null,
    previewImageUrl: model.thumbnailUrl ?? null,
    imageAlt: model.title,
    attribution: model.attributionText ?? null,
    licenseName: model.licenseLabel ?? null,
    licenseVerified: Boolean(model.pricingAllowed),
    platformLabel: labelForSourceType("thingiverse"),
  };
}

export function ThingiverseDetail({ model }: { model: ExternalModelSummary }) {
  const policy = useMemo(
    () => resolveLicenseCommercePolicyFromLabel(model.licenseLabel),
    [model.licenseLabel],
  );
  const [productionOptions, setProductionOptions] = useState<ProductionOptionsValue>({
    material: "pla",
    color: "beyaz",
    sizePreset: "orta",
    quantity: 1,
  });
  const [estimateMinor, setEstimateMinor] = useState<number | null>(null);
  const [disclaimerTr, setDisclaimerTr] = useState(
    "Tahmini üretim bedeli — sipariş onayı değildir.",
  );
  const [consultOpen, setConsultOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleEstimate = useCallback((grossMinor: number, disclaimer: string) => {
    setEstimateMinor(grossMinor);
    setDisclaimerTr(disclaimer);
  }, []);

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
    <main id="ana-icerik" className="relative pb-20 text-light-text">
      <article className="shell relative py-8 sm:py-10">
        <Link
          href={"/hazir-modeller" as Route}
          className="text-sm text-muted-light hover:text-light-text"
        >
          ← Hazır modeller
        </Link>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
          <div className="min-w-0 space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-midnight/70">
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
                        "relative size-16 overflow-hidden rounded-lg border",
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

          <aside className="min-w-0 space-y-6 lg:sticky lg:top-24">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-light">
                Thingiverse · {model.creatorName}
              </p>
              <h1 className="mt-2 font-heading text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                {model.title}
              </h1>
              <p className="mt-3 text-sm text-muted-light">{policy.statusLineTr}</p>
            </div>

            <PrintProductionOptions
              value={productionOptions}
              onChange={setProductionOptions}
              onEstimate={policy.showEstimate ? handleEstimate : undefined}
            />

            {policy.showEstimate ? (
              <EstimatedPriceBlock
                grossMinor={estimateMinor}
                disclaimerTr={disclaimerTr}
              />
            ) : null}

            {policy.allowPayment ? (
              <button
                type="button"
                data-external-quote-cta=""
                onClick={() => setQuoteOpen(true)}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-coral text-base font-semibold text-midnight"
              >
                {policy.primaryCtaTr}
              </button>
            ) : policy.allowConsultation ? (
              <>
                <button
                  type="button"
                  data-consultation-cta=""
                  onClick={() => setConsultOpen(true)}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-coral text-base font-semibold text-midnight"
                >
                  {policy.primaryCtaTr}
                </button>
                <p className="text-xs leading-5 text-muted-light">
                  Ödeme alınmaz. Talebiniz incelendikten sonra size dönüş yapılır.
                </p>
              </>
            ) : null}

            <a
              href={model.sourceUrl}
              rel="noreferrer"
              target="_blank"
              className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4"
            >
              Orijinal modeli görüntüle
            </a>

            <div className="border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setDetailsOpen((value) => !value)}
                className="flex w-full items-center justify-between text-sm font-semibold"
                aria-expanded={detailsOpen}
              >
                Model bilgileri
                <ChevronDown
                  className={cn("size-4 transition-transform", detailsOpen && "rotate-180")}
                />
              </button>
              {detailsOpen ? (
                <dl className="mt-3 space-y-2 text-xs text-muted-light">
                  <div className="flex justify-between gap-4">
                    <dt>Model ID</dt>
                    <dd>{model.externalId}</dd>
                  </div>
                  {typeof model.fileCount === "number" ? (
                    <div className="flex justify-between gap-4">
                      <dt>Dosya sayısı</dt>
                      <dd>{model.fileCount}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="mb-1">Atıf</dt>
                    <dd className="break-all">{model.attributionText}</dd>
                  </div>
                  {model.description ? (
                    <div>
                      <dt className="mb-1">Açıklama</dt>
                      <dd>{model.description}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </div>
          </aside>
        </div>
      </article>

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
        estimatedGrossMinor={estimateMinor}
      />

      <ExternalModelPriceModal
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
        model={toQuoteContext(model)}
      />
    </main>
  );
}
