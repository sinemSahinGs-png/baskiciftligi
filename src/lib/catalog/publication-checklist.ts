import type { ProductStatus } from "@/domain/catalog/types";
import type { ProductFormInput } from "@/lib/validation/catalog";
import { applyPublicationInput } from "@/lib/catalog/publication";

export type GuidedEditorStep = 1 | 2 | 3 | 4 | 5;

export type PublicationChecklistItem = {
  id: string;
  label: string;
  shortLabel: string;
  step: GuidedEditorStep;
  fieldId?: string;
  blocking: boolean;
  satisfied: boolean;
};

export type PublicationReadiness = {
  ready: boolean;
  items: PublicationChecklistItem[];
  blockingMessages: string[];
  completionPercent: number;
};

function hasUsableMedia(input: Pick<ProductFormInput, "media">): boolean {
  return input.media.some((item) => item.url.trim().length > 0);
}

function activeVariants(input: Pick<ProductFormInput, "variants">) {
  return input.variants.filter((variant) => variant.isActive);
}

function stockConfigValid(input: ProductFormInput): boolean {
  if (input.kind === "ready_stock") {
    return activeVariants(input).some((variant) => variant.inventoryQuantity > 0);
  }

  return (
    input.productionLeadTimeMinDays >= 0 &&
    input.productionLeadTimeMaxDays >= input.productionLeadTimeMinDays
  );
}

export function assessPublicationReadiness(
  input: ProductFormInput,
  now = new Date(),
): PublicationReadiness {
  const prepared =
    input.status === "active" ? applyPublicationInput(input, now) : input;

  const items: PublicationChecklistItem[] = [
    {
      id: "name",
      label: "Ürün adı girilmeli",
      shortLabel: "Ürün adı",
      step: 1,
      fieldId: "name",
      blocking: true,
      satisfied: prepared.name.trim().length >= 2,
    },
    {
      id: "shortDescription",
      label: "Kısa açıklama girilmeli",
      shortLabel: "Kısa açıklama",
      step: 1,
      fieldId: "shortDescription",
      blocking: true,
      satisfied: prepared.shortDescription.trim().length >= 10,
    },
    {
      id: "price",
      label: "Satış fiyatı 0 TL olamaz",
      shortLabel: "Satış fiyatı",
      step: 3,
      fieldId: "priceMinor",
      blocking: true,
      satisfied: (prepared.priceMinor ?? 0) > 0,
    },
    {
      id: "media",
      label: "En az bir ürün görseli eklenmeli",
      shortLabel: "Kapak görseli",
      step: 2,
      fieldId: "media-upload",
      blocking: true,
      satisfied: hasUsableMedia(prepared),
    },
    {
      id: "category",
      label: "En az bir kategori seçilmeli",
      shortLabel: "Kategori",
      step: 2,
      fieldId: "category-picker",
      blocking: true,
      satisfied: prepared.categorySlugs.length > 0,
    },
    {
      id: "variants",
      label: "En az bir aktif varyant olmalı",
      shortLabel: "Ürün seçeneği",
      step: 4,
      fieldId: "variant-mode",
      blocking: true,
      satisfied: activeVariants(prepared).length > 0,
    },
    {
      id: "inventory",
      label:
        prepared.kind === "ready_stock"
          ? "Stoklu ürünlerde stok miktarı girilmeli"
          : "Üretim süresi geçerli olmalı",
      shortLabel:
        prepared.kind === "ready_stock" ? "Stok" : "Üretim süresi",
      step: 3,
      fieldId: prepared.kind === "ready_stock" ? "stock-quantity" : "lead-time",
      blocking: true,
      satisfied: stockConfigValid(prepared),
    },
  ];

  const blockingMessages = items
    .filter((item) => item.blocking && !item.satisfied)
    .map((item) => item.label);

  const satisfiedCount = items.filter((item) => item.satisfied).length;

  return {
    ready: blockingMessages.length === 0,
    items,
    blockingMessages,
    completionPercent: Math.round((satisfiedCount / items.length) * 100),
  };
}

export function publicationSaveMessage(status: ProductStatus): string {
  switch (status) {
    case "active":
      return "Ürün yayınlandı";
    case "scheduled":
      return "Yayın planlandı. Belirlenen tarihte mağazada görünür olur.";
    case "archived":
      return "Ürün arşivlendi ve mağazadan kaldırıldı.";
    default:
      return "Taslak kaydedildi. Mağazada görünmez.";
  }
}

export function assessDraftReadiness(input: ProductFormInput): number {
  const checks = [
    input.name.trim().length >= 2,
    input.shortDescription.trim().length >= 4,
    input.slug.trim().length >= 2,
    input.media.some((item) => item.url.trim()),
    input.categorySlugs.length > 0,
    input.priceMinor !== null && input.priceMinor > 0,
  ];
  return Math.round(
    (checks.filter(Boolean).length / checks.length) * 100,
  );
}
