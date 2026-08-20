"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { SafeImage } from "@/components/media/safe-image";
import { ExternalModelPriceModal } from "@/components/models/external-model-price-modal";
import {
  platformLabel,
  type CuratedModelRecord,
} from "@/domain/curated-models/types";
import {
  labelForSourceType,
  sourceTypeFromPlatform,
  type ExternalQuoteModelContext,
} from "@/lib/models/external-quote-context";

export function CuratedModelDetail({ model }: { model: CuratedModelRecord }) {
  const isExternal = model.listingKind === "curated_external";
  const [modalOpen, setModalOpen] = useState(false);
  const ctaRef = useRef<HTMLButtonElement>(null);

  const quoteContext: ExternalQuoteModelContext = {
    externalModelId: model.id,
    sourceType: sourceTypeFromPlatform(model.platformType),
    sourceUrl: model.sourceUrl,
    title: model.titleTr,
    categoryLabel: model.categoryLabel,
    previewImageUrl: model.previewImageUrl,
    imageAlt: model.imageAlt,
    attribution: model.attributionText,
    licenseName: model.licenseVerified ? model.licenseCode : null,
    licenseVerified: model.licenseVerified,
    platformLabel: platformLabel(model.platformType),
    slug: model.slug,
  };

  return (
    <main id="ana-icerik" className="relative pb-24 text-light-text">
      <FoundryGrid variant="blueprint" className="opacity-30" />
      <article className="shell relative pt-10">
        <Link href={"/hazir-modeller" as Route} className="text-sm hover:underline">
          Hazır modellere dön
        </Link>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
          <div className="space-y-4">
            <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-midnight">
              {model.previewImageUrl ? (
                <SafeImage
                  src={model.previewImageUrl}
                  alt={model.imageAlt || model.titleTr}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover"
                  fallbackLabel="Önizleme yok"
                />
              ) : (
                <div className="grid h-full place-items-center text-sm text-muted-light">
                  Önizleme görseli yok
                </div>
              )}
            </div>
            {model.description ? (
              <p className="text-sm leading-6 text-muted-light">{model.description}</p>
            ) : null}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-xl border border-white/12 bg-carbon/80 p-6">
              {isExternal ? (
                <p className="text-xs font-medium tracking-wide text-muted-light">
                  Harici model · {labelForSourceType(quoteContext.sourceType)}
                </p>
              ) : null}
              <h1 className="mt-2 font-heading text-4xl font-bold tracking-[-0.04em]">
                {model.titleTr}
              </h1>
              {model.originalTitle && model.originalTitle !== model.titleTr ? (
                <p className="mt-2 text-sm text-muted-light">
                  Orijinal: {model.originalTitle}
                </p>
              ) : null}
              {model.categoryLabel ? (
                <p className="mt-3 text-sm text-muted-light">{model.categoryLabel}</p>
              ) : null}

              <p className="mt-6 rounded-md border border-white/10 bg-white/5 p-4 text-sm text-muted-light">
                Model dosyası bu katalogda saklanmaz. Kaynak sayfasından dosyayı
                edindikten sonra fiyat almak için yükleyebilirsiniz. Dosya
                yüklenmeden fiyat gösterilmez.
              </p>

              {isExternal ? (
                <button
                  ref={ctaRef}
                  type="button"
                  data-external-quote-cta=""
                  onClick={() => setModalOpen(true)}
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-coral text-sm font-semibold text-light-text"
                >
                  Dosyanı yükle ve fiyat al
                </button>
              ) : (
                <Link
                  href={"/model-yukle" as Route}
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-coral text-sm font-semibold text-light-text"
                >
                  Model dosyan varsa fiyat al
                </Link>
              )}
            </div>

            <section className="rounded-xl border border-white/12 bg-carbon/60 p-5 text-sm">
              <h2 className="font-semibold">Kaynak ve haklar</h2>
              <dl className="mt-3 space-y-2 text-muted-light">
                <div>
                  <dt className="text-xs tracking-wide uppercase">Kaynak platform</dt>
                  <dd>{platformLabel(model.platformType)}</dd>
                </div>
                {model.authorName ? (
                  <div>
                    <dt className="text-xs tracking-wide uppercase">Tasarımcı</dt>
                    <dd>{model.authorName}</dd>
                  </div>
                ) : null}
                {model.licenseVerified && model.licenseCode ? (
                  <div>
                    <dt className="text-xs tracking-wide uppercase">
                      Doğrulanmış lisans
                    </dt>
                    <dd>{model.licenseCode}</dd>
                  </div>
                ) : (
                  <div>
                    <dt className="text-xs tracking-wide uppercase">Lisans</dt>
                    <dd>Kaynak sayfasından doğrulayın</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs tracking-wide uppercase">Kaynak</dt>
                  <dd>
                    <a
                      href={`/api/hazir-modeller/source-open?kind=curated&id=${encodeURIComponent(model.slug)}`}
                      className="underline underline-offset-4"
                    >
                      Kaynak sayfasını görüntüle
                    </a>
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>
      </article>

      {isExternal ? (
        <ExternalModelPriceModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          model={quoteContext}
          returnFocusRef={ctaRef}
        />
      ) : null}
    </main>
  );
}
