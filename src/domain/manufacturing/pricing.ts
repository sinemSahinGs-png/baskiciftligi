import { createHash } from "node:crypto";

import { assertMinorUnits } from "@/lib/money";
import {
  FORMULA_ID,
  type InternalCostBreakdown,
  type PricingRates,
  type PublicPriceBreakdown,
  type SlicingMetrics,
} from "@/domain/manufacturing/types";

export function pricingChecksum(rates: PricingRates): string {
  return createHash("sha256").update(JSON.stringify(rates)).digest("hex");
}

function roundMinor(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError("Parasal ara değer sayısal değil.");
  }
  return assertMinorUnits(Math.round(value));
}

export function quantityMultiplier(
  quantity: number,
  adjustments: PricingRates["quantityAdjustments"],
): number {
  const sorted = [...adjustments].sort((a, b) => a.minQty - b.minQty);
  let multiplier = 1;
  for (const rule of sorted) {
    if (quantity >= rule.minQty) {
      multiplier = rule.multiplier;
    }
  }
  return multiplier;
}

export function computeQuotePrice(input: {
  metrics: SlicingMetrics;
  rates: PricingRates;
  reviewRequired: boolean;
  expiresAt: string;
  configurationSummary: string;
}): {
  publicBreakdown: PublicPriceBreakdown;
  internalBreakdown: InternalCostBreakdown;
  formulaId: typeof FORMULA_ID;
} {
  const quantity = Math.max(1, input.metrics.quantity);
  const printHours = input.metrics.estimatedDurationSeconds / 3600;
  const grams = input.metrics.filamentWeightGrams;
  const qtyMul = quantityMultiplier(quantity, input.rates.quantityAdjustments);

  const materialCostMinor = roundMinor(
    grams * input.rates.materialPricePerGramMinor * quantity * qtyMul,
  );
  const machineCostMinor = roundMinor(
    printHours * input.rates.machineHourlyRateMinor * quantity * qtyMul,
  );
  const energyCostMinor = roundMinor(
    printHours *
      input.rates.machinePowerKw *
      input.rates.electricityPricePerKwhMinor *
      quantity *
      qtyMul,
  );
  const setupFeeMinor = input.rates.setupFeeMinor;
  const postProcessingFeeMinor = roundMinor(
    input.rates.postProcessingFeeMinor * quantity,
  );
  const packagingFeeMinor = roundMinor(input.rates.packagingFeeMinor * quantity);
  const supportFeeMinor = input.metrics.supportUsed
    ? input.rates.supportHandlingFeeMinor
    : 0;
  const reviewFeeMinor = input.reviewRequired ? input.rates.modelReviewFeeMinor : 0;

  const directCostMinor = assertMinorUnits(
    materialCostMinor +
      machineCostMinor +
      energyCostMinor +
      setupFeeMinor +
      postProcessingFeeMinor +
      packagingFeeMinor +
      supportFeeMinor +
      reviewFeeMinor,
  );
  const riskAdjustedCostMinor = roundMinor(
    directCostMinor * (1 + input.rates.riskRate),
  );
  if (input.rates.targetMarginRate >= 1 || input.rates.targetMarginRate < 0) {
    throw new RangeError("Hedef brüt kâr oranı 0 ile 1 arasında olmalıdır.");
  }
  const unconstrainedNet = roundMinor(
    riskAdjustedCostMinor / (1 - input.rates.targetMarginRate),
  );
  const netSellingPriceMinor = assertMinorUnits(
    Math.max(input.rates.minimumOrderNetMinor, unconstrainedNet),
  );
  const vatMinor = roundMinor(netSellingPriceMinor * input.rates.vatRate);
  const grossPriceMinor = assertMinorUnits(netSellingPriceMinor + vatMinor);

  const internalBreakdown: InternalCostBreakdown = {
    materialCostMinor,
    machineCostMinor,
    energyCostMinor,
    setupFeeMinor,
    postProcessingFeeMinor,
    packagingFeeMinor,
    supportFeeMinor,
    reviewFeeMinor,
    directCostMinor,
    riskAdjustedCostMinor,
    netSellingPriceMinor,
    vatMinor,
    grossPriceMinor,
  };

  const publicBreakdown: PublicPriceBreakdown = {
    materialMinor: materialCostMinor,
    productionDurationSeconds: Math.round(
      input.metrics.estimatedDurationSeconds * quantity,
    ),
    quantity,
    configurationSummary: input.configurationSummary,
    netMinor: netSellingPriceMinor,
    vatMinor,
    grossMinor: grossPriceMinor,
    vatRate: input.rates.vatRate,
    shippingStatus: "not_included",
    quoteExpiresAt: input.expiresAt,
    reviewRequired: input.reviewRequired,
    reviewMessage: input.reviewRequired
      ? "Otomatik analiz tamamlandı ancak üretim öncesi teknik onay gerekiyor."
      : null,
  };

  return { publicBreakdown, internalBreakdown, formulaId: FORMULA_ID };
}

export const DEVELOPMENT_SEED_RATES: PricingRates = {
  materialPricePerGramMinor: 45,
  machineHourlyRateMinor: 15_000,
  electricityPricePerKwhMinor: 250,
  machinePowerKw: 0.15,
  setupFeeMinor: 2_500,
  postProcessingFeeMinor: 1_500,
  packagingFeeMinor: 2_000,
  supportHandlingFeeMinor: 750,
  modelReviewFeeMinor: 1_500,
  riskRate: 0.08,
  targetMarginRate: 0.35,
  minimumOrderNetMinor: 7_500,
  vatRate: 0.2,
  quoteLifetimeHours: 48,
  quantityAdjustments: [],
};
