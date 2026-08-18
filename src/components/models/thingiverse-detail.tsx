import type { Route } from "next";
import Link from "next/link";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { LicenseBadge } from "@/components/models/license-badge";
import { ModelSourceBadge } from "@/components/models/model-source-badge";
import { PermissionStatus } from "@/components/models/permission-status";
import { SafeImage } from "@/components/media/safe-image";
import { ThingiverseFilePicker } from "@/components/models/thingiverse-file-picker";
import { ThingiverseReviewForm } from "@/components/models/thingiverse-review-form";
import type { ExternalModelSummary } from "@/providers/contracts";

export function ThingiverseDetail({
  model,
}: {
  model: ExternalModelSummary;
}) {
  const verified = model.isPurchasable;

  return (
    <main id="ana-icerik" className="relative pb-24 text-light-text">
      <FoundryGrid variant="blueprint" className="opacity-30" />
      <article className="shell relative pt-10">
        <Link href={"/hazir-modeller" as Route} className="text-sm hover:underline">
          Hazır modellere dön
        </Link>
        <div className="mt-8 grid items-start gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
          <div className="space-y-4">
            <div className="relative aspect-square min-h-0 overflow-hidden rounded-xl bg-midnight">
              <FoundryGrid variant="measure" />
              {model.thumbnailUrl ? (
                <SafeImage
                  src={model.thumbnailUrl}
                  alt={model.title}
                  fill
                  sizes="60vw"
                  className="object-contain p-8"
                />
              ) : (
                <p className="absolute inset-0 grid place-items-center text-sm text-muted-light">
                  3D önizleme yok · küçük resim gelmedi
                </p>
              )}
            </div>
            {model.imageUrls && model.imageUrls.length > 0 ? (
              <ul className="grid grid-cols-3 gap-2">
                {model.imageUrls.map((url) => (
                  <li key={url} className="relative aspect-square overflow-hidden rounded-md bg-carbon">
                    <SafeImage src={url} alt="" fill sizes="20vw" className="object-cover" />
                  </li>
                ))}
              </ul>
            ) : null}
            {model.description ? (
              <p className="text-sm leading-6 text-muted-light">{model.description}</p>
            ) : null}
          </div>
          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-xl border border-white/12 bg-carbon/80 p-6">
              <div className="flex flex-wrap gap-2">
                <ModelSourceBadge source="thingiverse" />
                <LicenseBadge label={model.licenseLabel ?? "Lisans belirtilmedi"} />
              </div>
              <h1 className="mt-5 font-heading text-4xl font-bold tracking-[-0.04em]">
                {model.title}
              </h1>
              <p className="mt-2 text-sm text-muted-light">
                {model.attributionText}
              </p>
              <p className="mt-1 text-xs text-muted-light">
                Model ID {model.externalId}
              </p>
              <PermissionStatus
                state={
                  model.automaticManufacturingAllowed || verified
                    ? "verified"
                    : model.permissionStatus === "rejected"
                      ? "not-permitted"
                      : "unverified"
                }
              />
              {model.attributionRequired ? (
                <p className="mt-3 text-xs leading-5 text-muted-light">
                  Atıf zorunlu: {model.attributionText}
                </p>
              ) : (
                <p className="mt-3 text-xs leading-5 text-muted-light">
                  {model.attributionText}
                </p>
              )}
              {typeof model.fileCount === "number" ? (
                <p className="mt-2 text-xs text-muted-light">
                  Yazdırılabilir dosya (API): {model.fileCount}
                </p>
              ) : null}
              <a
                href={model.sourceUrl}
                rel="noreferrer"
                target="_blank"
                className="mt-4 inline-flex min-h-11 items-center font-semibold underline"
              >
                Orijinal modeli görüntüle
              </a>
            </div>
            {verified || model.automaticManufacturingAllowed ? (
              <div className="rounded-xl border border-success/30 bg-success/10 p-5">
                <p className="text-sm font-semibold">
                  Lisans eşlemesi otomatik üretime açık
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-light">
                  Bu, modelin kamuya açık olmasından çıkarılmaz. Yalnızca
                  eşlenen lisans allow-list’ine dayanır.
                </p>
                <div className="mt-4">
                  <ThingiverseFilePicker
                    thingId={model.externalId}
                    automaticAllowed
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-violet/35 bg-violet/12 p-5">
                <p className="text-sm leading-6">
                  Bu model görüntülenebilir ancak ücretli üretim izni otomatik
                  kapıdan geçmez.
                </p>
                <div className="mt-4">
                  <ThingiverseFilePicker
                    thingId={model.externalId}
                    automaticAllowed={false}
                  />
                </div>
                <ThingiverseReviewForm
                  externalId={model.externalId}
                  title={model.title}
                  creator={model.creatorName}
                  license={model.licenseLabel ?? ""}
                  originalUrl={model.sourceUrl}
                />
                <Link
                  href={"/hazir-modeller" as Route}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold underline"
                >
                  İzinli modellere dön
                </Link>
              </div>
            )}
          </aside>
        </div>
      </article>
    </main>
  );
}
