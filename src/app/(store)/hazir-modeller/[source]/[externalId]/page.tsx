import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Ban, Box, FileQuestion, KeyRound, Scale } from "lucide-react";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import {
  getOctoDemoModel,
  octoDemoModels,
} from "@/components/content/content-data";
import {
  ContentCard,
  ContentPage,
  StatusNotice,
} from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { LicenseBadge } from "@/components/models/license-badge";
import { ModelLibraryState } from "@/components/models/model-library-state";
import { ModelSourceBadge } from "@/components/models/model-source-badge";
import { PermissionReviewPanel } from "@/components/models/permission-review";
import { ThingiverseDetail } from "@/components/models/thingiverse-detail";
import { ThingiverseDetailUnavailable } from "@/components/models/thingiverse-detail-unavailable";
import { siteConfig } from "@/config/site";
import { ThingiverseApiError } from "@/providers/thingiverse/client";
import {
  getThingiverseConfigStatus,
  mapThingiverseHttpStatus,
  thingiverseProvider,
} from "@/providers/thingiverse/provider";
import { thingiverseStatusCopy } from "@/providers/thingiverse/status";

type ExternalModelPageProps = {
  params: Promise<{
    source: string;
    externalId: string;
  }>;
};

export function generateStaticParams() {
  const thingiverseStatus = [{ source: "thingiverse", externalId: "durum" }];
  if (process.env.NODE_ENV === "production") {
    return thingiverseStatus;
  }
  return [
    ...octoDemoModels.map((model) => ({
      source: "octo-demo",
      externalId: model.externalId,
    })),
    ...thingiverseStatus,
  ];
}

export async function generateMetadata({
  params,
}: ExternalModelPageProps): Promise<Metadata> {
  const { source, externalId } = await params;

  if (source === "thingiverse") {
    return createPageMetadata({
      title:
        externalId === "durum"
          ? "Thingiverse Entegrasyon Durumu"
          : `Thingiverse modeli ${externalId}`,
      description:
        "Resmî Thingiverse API keşfi. Ticari üretim ayrı izin kaydı ister.",
      path: `/hazir-modeller/${source}/${externalId}`,
      noIndex: true,
    });
  }

  const model =
    source === "octo-demo" ? getOctoDemoModel(externalId) : undefined;

  return createPageMetadata({
    title: model?.name ?? "Model Bulunamadı",
    description:
      model?.summary ??
      "Bu model kaydı bulunamadı veya desteklenen bir kaynağa ait değil.",
    path: `/hazir-modeller/${source}/${externalId}`,
    noIndex: true,
  });
}

export default async function ExternalModelPage({
  params,
}: ExternalModelPageProps) {
  const { source, externalId } = await params;

  if (source === "thingiverse" && externalId !== "durum" && /^\d+$/.test(externalId)) {
    const configStatus = getThingiverseConfigStatus();
    if (configStatus !== "connected") {
      return (
        <ContentPage
          eyebrow="Harici kaynak · Thingiverse"
          title={thingiverseStatusCopy[configStatus].title}
          description={thingiverseStatusCopy[configStatus].body}
          status={{ label: configStatus, tone: "warning" }}
          actions={[
            { href: "/hazir-modeller", label: "Model kütüphanesine dönün", variant: "outline" },
          ]}
          backLink={{ href: "/hazir-modeller", label: "Hazır modeller" }}
        />
      );
    }
    let model = null;
    let fetchStatus: ReturnType<typeof mapThingiverseHttpStatus> | null = null;
    try {
      model = await thingiverseProvider.getById(externalId, {
        correlationId: crypto.randomUUID(),
      });
    } catch (error) {
      fetchStatus =
        error instanceof ThingiverseApiError
          ? mapThingiverseHttpStatus(error.status)
          : "api_unavailable";
    }
    if (fetchStatus) {
      return (
        <ThingiverseDetailUnavailable
          externalId={externalId}
          status={fetchStatus}
        />
      );
    }
    if (!model) {
      notFound();
    }
    return <ThingiverseDetail model={model} />;
  }

  if (source === "thingiverse") {
    const configStatus = getThingiverseConfigStatus();
    return (
      <ContentPage
        eyebrow="Harici kaynak · Thingiverse"
        title={thingiverseStatusCopy[configStatus].title}
        description={thingiverseStatusCopy[configStatus].body}
        status={{ label: configStatus, tone: "warning" }}
        actions={[
          {
            href: "/hazir-modeller",
            label: "Model kütüphanesine dönün",
            variant: "outline",
          },
        ]}
        backLink={{ href: "/hazir-modeller", label: "Hazır modeller" }}
      >
        <StatusNotice
          title="URL’deki model kimliği sorgulanmadı"
          tone="warning"
        >
          <p>
            Bu adresteki model kimliği resmî API’ye gönderilmez. Aktif kimlik
            bilgisi olmadan sonuç üretilmez. Bu model görüntülenebilir ancak
            ücretli üretim izni henüz doğrulanmadı.
          </p>
        </StatusNotice>

        <div className="mt-10 grid gap-3 md:grid-cols-2">
          <ModelLibraryState id="api-unavailable" />
          <ModelLibraryState id="sign-in-required" />
          <ModelLibraryState id="not-permitted" />
          <ModelLibraryState id="removed" />
        </div>

        <section
          className="mt-12 grid gap-4 md:grid-cols-3"
          aria-label="Thingiverse aktivasyon kapıları"
        >
          <ContentCard
            title="Resmî erişim"
            description="Yalnız Thingiverse’in güncel resmî API’si ve onaylı kimlik akışı kullanılmalıdır."
          >
            <KeyRound aria-hidden="true" className="size-6" />
          </ContentCard>
          <ContentCard
            title="Lisans incelemesi"
            description="API metadata’sı gelse bile lisans, atıf ve ticari üretim izni ayrı değerlendirilmelidir."
          >
            <Scale aria-hidden="true" className="size-6" />
          </ContentCard>
          <ContentCard
            title="Satın alma kilidi"
            description="İzin kaydı doğrulanmadan model fiyatlandırılamaz veya üretime alınamaz."
          >
            <Ban aria-hidden="true" className="size-6 text-brand" />
          </ContentCard>
        </section>
      </ContentPage>
    );
  }

  if (source === "baski-ciftligi") {
    const { getPublishedCuratedModel } = await import("@/domain/curated-models/repository");
    const { CuratedModelDetail } = await import("@/components/models/curated-model-detail");
    const model = await getPublishedCuratedModel(externalId);
    if (!model) {
      notFound();
    }
    return <CuratedModelDetail model={model} />;
  }

  if (source !== "octo-demo") {
    notFound();
  }
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const model = getOctoDemoModel(externalId);

  if (!model) {
    notFound();
  }

  return (
    <main id="ana-icerik" className="relative pb-24 text-light-text">
      <FoundryGrid variant="blueprint" className="opacity-30" />
      <article className="shell relative pt-10">
        <Link href={"/hazir-modeller" as Route} className="text-sm hover:underline">
          Hazır modellere dön
        </Link>

        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
          <div className="space-y-4">
            <div className="relative grid aspect-square min-h-0 place-items-center overflow-hidden rounded-xl bg-midnight">
              <FoundryGrid variant="measure" />
              <FoundryGrid variant="fade" className="opacity-60" />
              <div className="absolute top-4 left-4 z-10 flex gap-2 text-xs tracking-wide text-cyan/80">
                <span>X —</span>
                <span>Y —</span>
                <span>Z —</span>
              </div>
              <div className="relative text-center">
                <FileQuestion aria-hidden="true" className="mx-auto size-10 text-cyan" />
                <p className="mt-4 text-sm text-muted-light">
                  3D önizleme henüz bağlı değil
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="grid aspect-square place-items-center rounded-md border border-white/12 bg-carbon">
                <Box aria-hidden="true" className="size-5 text-muted-light" />
              </div>
              <div className="grid aspect-square place-items-center rounded-md border border-white/12 bg-carbon text-xs text-muted-light">
                Görsel yok
              </div>
              <div className="grid aspect-square place-items-center rounded-md border border-white/12 bg-carbon text-xs text-muted-light">
                Dosya yok
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-light">{model.summary}</p>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-xl border border-white/12 bg-carbon/80 p-6">
              <div className="flex flex-wrap gap-2">
                <ModelSourceBadge source="owned" />
                <LicenseBadge label="Demo · lisans yok" />
              </div>
              <h1 className="mt-5 font-heading text-4xl font-bold tracking-[-0.04em]">
                {model.name}
              </h1>
              <p className="mt-2 text-sm text-muted-light">
                Tasarımcı: {siteConfig.studioLabel}
              </p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-light">Kategori</dt>
                  <dd className="font-semibold">{model.category}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-light">Parça / dosya</dt>
                  <dd className="font-semibold">Dosya bağlı değil</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-light">Ölçüler</dt>
                  <dd className="font-semibold">Doğrulanmadı</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-light">Baskı önerisi</dt>
                  <dd className="text-right font-semibold">{model.intendedProcess}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-light">Malzeme önerisi</dt>
                  <dd className="font-semibold">Doğrulanmadı</dd>
                </div>
              </dl>
            </div>
            <PermissionReviewPanel creator={siteConfig.studioLabel} />
          </aside>
        </div>

        <section className="mt-16 max-w-3xl">
          <h2 className="font-heading text-3xl font-bold">Doğrulanması gerekenler</h2>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-muted-light">
            {model.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </article>
    </main>
  );
}
