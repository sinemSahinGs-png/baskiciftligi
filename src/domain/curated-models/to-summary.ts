import { normalizeLicense } from "@/domain/manufacturing/licenses";
import type { CuratedModelRecord } from "@/domain/curated-models/types";
import type { ExternalModelSummary } from "@/providers/contracts";
import { siteConfig } from "@/config/site";

export function curatedModelToSummary(model: CuratedModelRecord): ExternalModelSummary {
  const hasStudioFile =
    model.listingKind === "studio" && Boolean(model.downloadUrl);
  const license = normalizeLicense(
    model.licenseVerified ? model.licenseCode : null,
  );
  const automatic =
    hasStudioFile &&
    model.licenseVerified &&
    license.automaticManufacturingAllowed;

  return {
    source: "baski-ciftligi",
    externalId: model.slug,
    title: model.titleTr || model.title,
    creatorName: model.authorName ?? siteConfig.name,
    creatorUrl: model.authorUrl ?? undefined,
    sourceUrl: model.sourceUrl,
    thumbnailUrl: model.previewImageUrl ?? undefined,
    licenseLabel: model.licenseVerified
      ? model.licenseCode ?? "Doğrulanmış lisans"
      : "Lisans doğrulanmadı",
    attributionText:
      model.attributionText ??
      `${model.titleTr || model.title} — ${model.authorName ?? "tasarımcı"} · ${model.sourceUrl}`,
    attributionRequired: license.attributionRequired,
    permissionStatus: automatic
      ? "permission_verified"
      : "license_review",
    isPurchasable: false,
    automaticManufacturingAllowed: false,
    description: model.description ?? undefined,
    fileCount: hasStudioFile ? 1 : 0,
  };
}
