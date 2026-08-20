import {
  computeCartShippingMinor,
} from "@/domain/commerce/shipping-policy";
import {
  computeQuotePrice,
  DEVELOPMENT_SEED_RATES,
} from "@/domain/manufacturing/pricing";
import type { PricingRates, SlicingMetrics } from "@/domain/manufacturing/types";

export const CUBE_SLICE_METRICS = {
  grams: 4.6,
  seconds: 1193,
  supportUsed: true,
} as const;

export interface PricingScenarioRow {
  id: string;
  label: string;
  quantity: number;
  grams: number;
  seconds: number;
  materialMinor: number;
  machineMinor: number;
  energyMinor: number;
  setupMinor: number;
  postMinor: number;
  packagingMinor: number;
  supportMinor: number;
  reviewMinor: number;
  directMinor: number;
  riskAdjustedMinor: number;
  unconstrainedNetMinor: number;
  netMinor: number;
  vatMinor: number;
  grossMinor: number;
  shippingMinor: number;
  cartTotalMinor: number;
  pricePerGramMinor: number;
  pricePerMachineHourMinor: number;
  unitGrossMinor: number;
}

function metricsFor(input: {
  grams: number;
  seconds: number;
  quantity: number;
  supportUsed?: boolean;
}): SlicingMetrics {
  return {
    dimensionsMm: { x: 20, y: 20, z: 20 },
    filamentLengthMm: 1543.7,
    filamentWeightGrams: input.grams,
    estimatedDurationSeconds: input.seconds,
    layerCount: 100,
    supportUsed: input.supportUsed ?? false,
    materialId: "pla",
    qualityId: "standart",
    quantity: input.quantity,
    orientation: { rotateX: 0, rotateY: 0, rotateZ: 0 },
    engine: { name: "PrusaSlicer", version: "2.8.1" },
    profileChecksum: "audit",
    warnings: [],
  };
}

export function scenarioRow(
  id: string,
  label: string,
  input: { grams: number; seconds: number; quantity: number; supportUsed?: boolean },
  rates: PricingRates = DEVELOPMENT_SEED_RATES,
): PricingScenarioRow {
  const priced = computeQuotePrice({
    metrics: metricsFor(input),
    rates,
    reviewRequired: false,
    expiresAt: "2026-08-21T00:00:00.000Z",
    configurationSummary: "PLA · Standart · %20 dolgu",
  });
  const internal = priced.internalBreakdown;
  const hours = Math.max(input.seconds / 3600, 1 / 3600);
  return {
    id,
    label,
    quantity: input.quantity,
    grams: input.grams,
    seconds: input.seconds,
    materialMinor: internal.materialCostMinor,
    machineMinor: internal.machineCostMinor,
    energyMinor: internal.energyCostMinor,
    setupMinor: internal.setupFeeMinor,
    postMinor: internal.postProcessingFeeMinor,
    packagingMinor: internal.packagingFeeMinor,
    supportMinor: internal.supportFeeMinor,
    reviewMinor: internal.reviewFeeMinor,
    directMinor: internal.directCostMinor,
    riskAdjustedMinor: internal.riskAdjustedCostMinor,
    unconstrainedNetMinor: Math.round(
      internal.riskAdjustedCostMinor / (1 - rates.targetMarginRate),
    ),
    netMinor: priced.publicBreakdown.netMinor,
    vatMinor: priced.publicBreakdown.vatMinor,
    grossMinor: priced.publicBreakdown.grossMinor,
    shippingMinor: computeCartShippingMinor(priced.publicBreakdown.grossMinor),
    cartTotalMinor:
      priced.publicBreakdown.grossMinor +
      computeCartShippingMinor(priced.publicBreakdown.grossMinor),
    pricePerGramMinor: Math.round(
      priced.publicBreakdown.grossMinor / Math.max(input.grams * input.quantity, 0.01),
    ),
    pricePerMachineHourMinor: Math.round(
      priced.publicBreakdown.grossMinor / (hours * input.quantity),
    ),
    unitGrossMinor: Math.round(priced.publicBreakdown.grossMinor / input.quantity),
  };
}

export function currentPricingAuditRows(): PricingScenarioRow[] {
  return [
    scenarioRow("cube-1", "20 mm küp · 1 adet", {
      grams: CUBE_SLICE_METRICS.grams,
      seconds: CUBE_SLICE_METRICS.seconds,
      quantity: 1,
      supportUsed: true,
    }),
    scenarioRow("cube-5", "20 mm küp · 5 adet", {
      grams: CUBE_SLICE_METRICS.grams,
      seconds: CUBE_SLICE_METRICS.seconds,
      quantity: 5,
      supportUsed: true,
    }),
    scenarioRow("cube-10", "20 mm küp · 10 adet", {
      grams: CUBE_SLICE_METRICS.grams,
      seconds: CUBE_SLICE_METRICS.seconds,
      quantity: 10,
      supportUsed: true,
    }),
    scenarioRow("pla-100g-5h", "100 g / 5 saat PLA", {
      grams: 100,
      seconds: 5 * 3600,
      quantity: 1,
    }),
    scenarioRow("pla-250g-12h", "250 g / 12 saat PLA", {
      grams: 250,
      seconds: 12 * 3600,
      quantity: 1,
    }),
    scenarioRow("pla-500g-24h", "500 g / 24 saat PLA", {
      grams: 500,
      seconds: 24 * 3600,
      quantity: 1,
    }),
  ];
}

export const INACTIVE_RATE_OPTIONS: Array<{
  id: "launch" | "balanced" | "premium";
  label: string;
  status: "inactive";
  summary: string;
  rates: PricingRates;
}> = [
  {
    id: "launch",
    label: "Rekabetçi lansman",
    status: "inactive",
    summary:
      "Kurulum 15 ₺ (iş başına bir kez), paketleme 12 ₺/adet, son işlem 9 ₺/adet, marj %22, asgari net 50 ₺. Tahsis kuralı değişmez; sahip seçene kadar etkin değildir.",
    rates: {
      ...DEVELOPMENT_SEED_RATES,
      setupFeeMinor: 1_500,
      packagingFeeMinor: 1_200,
      postProcessingFeeMinor: 900,
      targetMarginRate: 0.22,
      minimumOrderNetMinor: 5_000,
    },
  },
  {
    id: "balanced",
    label: "Dengeli standart",
    status: "inactive",
    summary:
      "Mevcut tohum oranlarının kopyası. Etkinleştirilmedikçe aktif tarifeyi değiştirmez.",
    rates: { ...DEVELOPMENT_SEED_RATES },
  },
  {
    id: "premium",
    label: "Yüksek hizmet",
    status: "inactive",
    summary:
      "Makine saati ve marj yükseltilir; destek elleçleme artar. Sahip seçene kadar etkin değildir.",
    rates: {
      ...DEVELOPMENT_SEED_RATES,
      machineHourlyRateMinor: 22_000,
      supportHandlingFeeMinor: 1_500,
      targetMarginRate: 0.42,
      minimumOrderNetMinor: 12_000,
    },
  },
];

export const PRICING_FORMULA_NOTES = [
  "Malzeme = gram × 0,45 ₺ × adet. Küp: 4,6 × 45 = 207 kuruş.",
  "Makine = (saniye/3600) × 150 ₺/sa × adet. Küp: 1193s → 4971 kuruş.",
  "Enerji = saat × 0,15 kW × 2,50 ₺/kWh × adet. Küp: 12 kuruş. Makine bedeline eklenir, çift sayılmaz.",
  "Kurulum 25 ₺ iş başına bir kez; adetle çarpılmaz.",
  "Son işlem 15 ₺ ve paketleme 20 ₺ her kopya için çarpılır.",
  "Destek 7,50 ₺, dilimleyicinin supportUsed bayrağına bağlı operasyon el işçiliğidir; filament zaten malzemededir.",
  "Paketleme ürün teklifindedir. Kargo 89,90 ₺ ayrıdır (shippingStatus: not_included). Çift kargo sayımı yoktur; kutu + kurye ayrılmıştır.",
  "Risk %8 doğrudan maliyet üzerine; marj net = risk / (1-0,35). KDV netin %20'si. Asgari net 75 ₺ bu küpü bağlamaz.",
] as const;
