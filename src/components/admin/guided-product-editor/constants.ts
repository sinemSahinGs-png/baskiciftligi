import type { GuidedEditorStep } from "@/lib/catalog/publication-checklist";
import { draftsMeaningfullyDiffer } from "@/lib/catalog/price-input";
import type { ProductFormInput } from "@/lib/validation/catalog";

export const EDITOR_STEPS: Array<{
  id: GuidedEditorStep;
  label: string;
  shortLabel: string;
}> = [
  { id: 1, label: "Temel bilgiler", shortLabel: "Temel" },
  { id: 2, label: "Görsel ve kategori", shortLabel: "Görsel" },
  { id: 3, label: "Fiyat ve stok", shortLabel: "Fiyat" },
  { id: 4, label: "Ürün seçenekleri", shortLabel: "Seçenek" },
  { id: 5, label: "Kontrol ve yayınla", shortLabel: "Yayın" },
];

export const DEFAULT_VAT_BPS = 2000;

export const ACCEPTED_IMAGE_TYPES =
  "image/png,image/jpeg,image/webp,image/avif";

export const LEAD_TIME_PRESETS = [
  { label: "1–2 iş günü", min: 1, max: 2 },
  { label: "3–5 iş günü", min: 3, max: 5 },
  { label: "5–7 iş günü", min: 5, max: 7 },
  { label: "Özel süre", min: null, max: null },
] as const;

export interface StoredDraftEnvelope {
  draft: Partial<ProductFormInput>;
  savedAt: number;
  serverRevisionAt: string;
}

export function editorStorageKey(productId: string | undefined): string {
  return `octo-guided-product-draft:${productId ?? "new"}`;
}

export function draftMetaStorageKey(productId: string | undefined): string {
  return `octo-guided-product-draft-meta:${productId ?? "new"}`;
}

export function serverStorageKey(productId: string | undefined): string {
  return `octo-guided-product-server:${productId ?? "new"}`;
}

export function isStoredDraftEnvelope(value: unknown): value is StoredDraftEnvelope {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    value !== null &&
    "draft" in value &&
    "savedAt" in value &&
    "serverRevisionAt" in value
  );
}

export type StoredDraftInspection =
  | { kind: "conflict"; envelope: StoredDraftEnvelope }
  | { kind: "restore"; draft: Partial<ProductFormInput> }
  | { kind: "none" };

export function inspectStoredDraft(
  storageKey: string,
  revisionAt: string,
  serverPriceMinor: number | null,
): StoredDraftInspection {
  if (typeof window === "undefined") {
    return { kind: "none" };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return { kind: "none" };
    }

    const parsed: unknown = JSON.parse(raw);
    const serverRevisionMs = Date.parse(revisionAt) || 0;

    if (isStoredDraftEnvelope(parsed)) {
      if (
        draftsMeaningfullyDiffer(
          { priceMinor: serverPriceMinor },
          { priceMinor: parsed.draft.priceMinor ?? null },
        )
      ) {
        return { kind: "conflict", envelope: parsed };
      }
      if (
        parsed.savedAt >= serverRevisionMs &&
        parsed.serverRevisionAt === revisionAt
      ) {
        return { kind: "restore", draft: parsed.draft };
      }
      return { kind: "none" };
    }

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const legacyDraft = parsed as Partial<ProductFormInput>;
      if (
        draftsMeaningfullyDiffer(
          { priceMinor: serverPriceMinor },
          { priceMinor: legacyDraft.priceMinor ?? null },
        )
      ) {
        return {
          kind: "conflict",
          envelope: {
            draft: legacyDraft,
            savedAt: Date.now(),
            serverRevisionAt: revisionAt,
          },
        };
      }
    }
  } catch {
    // ignore corrupt drafts
  }

  return { kind: "none" };
}
