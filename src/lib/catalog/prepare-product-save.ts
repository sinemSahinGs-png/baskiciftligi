import { slugifyTurkish } from "@/lib/catalog/slug";
import type { ProductFormInput } from "@/lib/validation/catalog";

export type VariantMode = "single" | "multi";

function coverMedia(input: ProductFormInput): ProductFormInput["media"] {
  if (!input.media.length) {
    return input.media;
  }

  const hasCover = input.media.some(
    (item) => item.role === "cover" || item.role === "primary",
  );
  if (hasCover) {
    return input.media.map((item, index) => ({ ...item, position: index }));
  }

  return input.media.map((item, index) => ({
    ...item,
    position: index,
    role: index === 0 ? "cover" : item.role ?? "gallery",
  }));
}

export function ensureDefaultVariant(
  input: ProductFormInput,
  variantMode: VariantMode,
): ProductFormInput["variants"] {
  if (variantMode === "multi" && input.variants.length > 0) {
    return input.variants.map((variant) => ({
      ...variant,
      isActive: variant.isActive ?? true,
    }));
  }

  const existing = input.variants[0];
  return [
    {
      id: existing?.id,
      name: existing?.name?.trim() || "Standart",
      sku: existing?.sku?.trim() || input.sku.trim() || "STANDART",
      barcode: existing?.barcode ?? "",
      colorName: existing?.colorName ?? "",
      colorHex: existing?.colorHex ?? "",
      material: existing?.material ?? "",
      sizeLabel: existing?.sizeLabel ?? "",
      priceAdjustmentMinor: existing?.priceAdjustmentMinor ?? 0,
      inventoryQuantity: existing?.inventoryQuantity ?? 0,
      isActive: true,
    },
  ];
}

export function prepareProductForSave(
  input: ProductFormInput,
  options: {
    variantMode?: VariantMode;
    publishing?: boolean;
    draft?: boolean;
  } = {},
): ProductFormInput {
  const variantMode =
    options.variantMode ??
    (input.variants.length > 1 ? "multi" : "single");

  const variants = ensureDefaultVariant(input, variantMode);
  const name = input.name.trim() || "Adsız taslak ürün";
  const slug =
    input.slug.trim().length >= 2
      ? input.slug
      : slugifyTurkish(name) || `taslak-${(input.id ?? "yeni").slice(0, 8)}`;
  const shortDescription =
    input.shortDescription.trim().length >= 10
      ? input.shortDescription
      : options.draft
        ? "Taslak ürün açıklaması."
        : input.shortDescription;
  const description =
    input.description.trim().length >= 20
      ? input.description
      : input.description.trim().length > 0
        ? input.description
        : shortDescription.length >= 20
          ? shortDescription
          : `${shortDescription} Detaylı ürün açıklaması.`.slice(0, 20_000);
  const sku =
    input.sku.trim() ||
    variants[0]?.sku?.trim() ||
    `BC-GEN-${(input.id ?? "000").slice(0, 3).toUpperCase()}`;

  return {
    ...input,
    name,
    slug,
    shortDescription,
    description,
    sku,
    variants: variants.map((variant) => ({
      ...variant,
      sku: variant.sku.trim() || sku,
    })),
    media: coverMedia(input),
    compareAtPriceMinor:
      input.compareAtPriceMinor && input.compareAtPriceMinor > 0
        ? input.compareAtPriceMinor
        : null,
    seoTitle: input.seoTitle?.trim() || name,
    seoDescription:
      input.seoDescription?.trim() || shortDescription.slice(0, 320),
    status: options.publishing ? "active" : input.status === "archived" ? "archived" : "draft",
  };
}
