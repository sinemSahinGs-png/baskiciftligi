"use client";

import { formatMoney } from "@/lib/money";
import type { ProductFormInput } from "@/lib/validation/catalog";
import { ProductStage } from "@/components/catalog/product-stage";
import { isStagePreset } from "@/domain/visual/stages";

type StorefrontPreviewCardProps = {
  values: ProductFormInput;
  categoryName?: string;
  compact?: boolean;
  large?: boolean;
};

export function StorefrontPreviewCard({
  values,
  categoryName,
  compact = false,
  large = false,
}: StorefrontPreviewCardProps) {
  const cover =
    values.media.find((item) => item.role === "cover" || item.role === "primary") ??
    values.media[0];
  const stage = isStagePreset(values.stagePreset)
    ? values.stagePreset
    : "cobalt";
  const priceMinor = values.priceMinor ?? 0;

  return (
    <div
      className="overflow-hidden rounded-3xl border border-white/10 bg-card"
      data-testid="storefront-preview-card"
    >
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Mağaza kartı önizlemesi
        </p>
      </div>
      <div className={compact ? "p-3" : large ? "p-5" : "p-4"}>
        <ProductStage
          stage={stage}
          src={cover?.url}
          alt={cover?.alt || values.name || "Ürün"}
          isolated={Boolean(values.isolated)}
          objectPosition={values.objectPosition || cover?.objectPosition || "50% 40%"}
          mobileObjectPosition={
            values.mobileObjectPosition || cover?.mobileObjectPosition || "50% 30%"
          }
          ratio="standard"
          className={`rounded-2xl ${large ? "min-h-[280px]" : ""}`}
        />
        <div className="mt-4 space-y-2">
          {categoryName ? (
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {categoryName}
            </p>
          ) : null}
          <h3
            className={`line-clamp-2 font-heading font-medium ${
              large ? "text-2xl" : "text-lg"
            }`}
          >
            {values.name || "Ürün adı"}
          </h3>
          <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">
            {values.shortDescription || "Kısa açıklama burada görünür."}
          </p>
          <p
            className={`font-heading text-cyan ${large ? "text-3xl" : "text-xl"}`}
            data-testid="preview-price"
          >
            {priceMinor > 0 ? formatMoney(priceMinor) : "Fiyat girilmedi"}
          </p>
        </div>
      </div>
    </div>
  );
}
