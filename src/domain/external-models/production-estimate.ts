import { computeQuotePrice, DEVELOPMENT_SEED_RATES } from "@/domain/manufacturing/pricing";
import type { SlicingMetrics } from "@/domain/manufacturing/types";

export const PRINT_SIZE_PRESETS = {
  kucuk: { label: "Küçük (≈8 cm)", grams: 35, hours: 1.5 },
  orta: { label: "Orta (≈15 cm)", grams: 90, hours: 4 },
  buyuk: { label: "Büyük (≈25 cm)", grams: 180, hours: 8 },
} as const;

export type PrintSizePresetId = keyof typeof PRINT_SIZE_PRESETS;

export const PRINT_MATERIALS = [
  { id: "pla", label: "PLA" },
  { id: "petg", label: "PETG" },
  { id: "abs", label: "ABS" },
] as const;

export const PRINT_COLORS = [
  { id: "beyaz", label: "Beyaz" },
  { id: "siyah", label: "Siyah" },
  { id: "gri", label: "Gri" },
  { id: "ozel", label: "Özel renk (not)" },
] as const;

export interface ProductionEstimateInput {
  sizePreset: PrintSizePresetId;
  quantity: number;
  materialId?: string;
  colorId?: string;
}

export function estimateProductionPrice(input: ProductionEstimateInput) {
  const preset = PRINT_SIZE_PRESETS[input.sizePreset];
  const quantity = Math.max(1, Math.min(99, Math.trunc(input.quantity)));
  const metrics: SlicingMetrics = {
    dimensionsMm: { x: 80, y: 80, z: preset.grams / 2 },
    filamentLengthMm: preset.grams * 10,
    filamentWeightGrams: preset.grams,
    estimatedDurationSeconds: Math.round(preset.hours * 3600),
    layerCount: null,
    supportUsed: false,
    materialId: (input.materialId as SlicingMetrics["materialId"]) ?? "pla",
    qualityId: "standart",
    quantity,
    orientation: { rotateX: 0, rotateY: 0, rotateZ: 0 },
    engine: { name: "estimate", version: "1" },
    profileChecksum: "estimate",
    warnings: [],
  };
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const priced = computeQuotePrice({
    metrics,
    rates: DEVELOPMENT_SEED_RATES,
    reviewRequired: false,
    expiresAt,
    configurationSummary: `${preset.label} · ${quantity} adet`,
  });
  return {
    grossMinor: priced.publicBreakdown.grossMinor,
    netMinor: priced.publicBreakdown.netMinor,
    quantity,
    sizeLabel: preset.label,
    disclaimerTr: "Tahmini üretim bedeli — sipariş onayı değildir.",
  };
}
