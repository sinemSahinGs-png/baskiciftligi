import { computeCalibratedQuote } from "@/domain/manufacturing/pricing-calibration";
import {
  COMMERCE_SHIPPING_POLICY,
  computeCartShippingMinor,
} from "@/domain/commerce/shipping-policy";
import type { PricingCalibrationInputs, SlicingMetrics } from "@/domain/manufacturing/types";

export const OWNER_PRODUCTION_PRESET_NAME = "Bambu Lab A1 Combo — Standart Üretim";

/**
 * VAT-exclusive owner costs. Inclusive shelf prices (650 TL filament, 24.000 TL
 * printer) are divided by 1.20 once; the formula never adds purchase VAT again.
 */
export const LAUNCH_OWNER_CALIBRATION: PricingCalibrationInputs = {
  presetName: OWNER_PRODUCTION_PRESET_NAME,
  filamentSpoolPriceMinor: 54_167,
  spoolWeightGrams: 1_000,
  wastePercent: 8,
  printerPurchasePriceMinor: 2_000_000,
  depreciationHours: 6_000,
  maintenanceBasis: "hourly",
  maintenanceMinor: 300,
  expectedAnnualPrintHours: 0,
  electricityPricePerKwhMinor: 350,
  printerPowerWatts: 150,
  laborHourlyMinor: 25_000,
  setupMinutesPerOrder: 10,
  postProcessingMinutesPerUnit: 3,
  supportRemovalMinutesPerJob: 5,
  packagingMinor: 2_000,
  packagingBasis: "shipment",
  failedPrintPercent: 8,
  targetMarginRate: 0.3,
  minimumOrderNetMinor: 7_500,
  vatRate: 0.2,
  shippingDisplayMinor: COMMERCE_SHIPPING_POLICY.standardShippingMinor,
  shippingFreeThresholdMinor: COMMERCE_SHIPPING_POLICY.freeShippingThresholdMinor,
  quoteLifetimeHours: 24,
};

export const LAUNCH_ACTIVATION_CONFIRM_PHRASE = "BC-QUOTE-V2-ACTIVATE";

export const INCLUSIVE_FILAMENT_SPOOL_MINOR = 65_000;
export const INCLUSIVE_PRINTER_PURCHASE_MINOR = 2_400_000;

export interface LaunchScenarioResult {
  id: string;
  label: string;
  quantity: number;
  grams: number;
  seconds: number;
  supportUsed: boolean;
  directMinor: number;
  riskAdjustedMinor: number;
  minimumOrderAdjustmentMinor: number;
  minimumApplied: boolean;
  profitMinor: number;
  netMinor: number;
  vatMinor: number;
  grossMinor: number;
  shippingMinor: number;
  cartTotalMinor: number;
  unitGrossMinor: number;
  supportLaborMinor: number;
}

function effectiveShippingMinor(grossMinor: number): number {
  return computeCartShippingMinor(grossMinor);
}

function scenarioFromQuote(
  id: string,
  label: string,
  metrics: Pick<
    SlicingMetrics,
    "filamentWeightGrams" | "estimatedDurationSeconds" | "quantity" | "supportUsed"
  >,
  calibration: PricingCalibrationInputs,
): LaunchScenarioResult {
  const quote = computeCalibratedQuote({
    metrics,
    calibration,
    expiresAt: "2099-01-01T00:00:00.000Z",
    configurationSummary: "PLA · Standart · önizleme",
  });
  const shippingMinor = effectiveShippingMinor(quote.grossMinor);
  return {
    id,
    label,
    quantity: metrics.quantity,
    grams: metrics.filamentWeightGrams,
    seconds: metrics.estimatedDurationSeconds,
    supportUsed: metrics.supportUsed ?? false,
    directMinor: quote.directMinor,
    riskAdjustedMinor: quote.riskAdjustedMinor,
    minimumOrderAdjustmentMinor: quote.minimumApplied
      ? quote.netMinor - quote.unconstrainedNetMinor
      : 0,
    minimumApplied: quote.minimumApplied,
    profitMinor: quote.profitMinor,
    netMinor: quote.netMinor,
    vatMinor: quote.vatMinor,
    grossMinor: quote.grossMinor,
    shippingMinor,
    cartTotalMinor: quote.grossMinor + shippingMinor,
    unitGrossMinor: quote.unitGrossMinor,
    supportLaborMinor: quote.supportLaborMinor,
  };
}

/** Nine verification scenarios required before bc-quote-v2 activation. */
export function launchVerificationScenarios(
  calibration: PricingCalibrationInputs = LAUNCH_OWNER_CALIBRATION,
): LaunchScenarioResult[] {
  const cube = {
    filamentWeightGrams: 4.6,
    estimatedDurationSeconds: 1193,
  } as const;

  return [
    scenarioFromQuote(
      "cube-1",
      "20 mm küp · 1 adet",
      { ...cube, quantity: 1, supportUsed: false },
      calibration,
    ),
    scenarioFromQuote(
      "cube-5",
      "20 mm küp · 5 adet",
      { ...cube, quantity: 5, supportUsed: false },
      calibration,
    ),
    scenarioFromQuote(
      "cube-10",
      "20 mm küp · 10 adet",
      { ...cube, quantity: 10, supportUsed: false },
      calibration,
    ),
    scenarioFromQuote(
      "pla-100g-5h",
      "100 g / 5 saat PLA",
      {
        filamentWeightGrams: 100,
        estimatedDurationSeconds: 5 * 3600,
        quantity: 1,
        supportUsed: false,
      },
      calibration,
    ),
    scenarioFromQuote(
      "pla-250g-12h",
      "250 g / 12 saat PLA",
      {
        filamentWeightGrams: 250,
        estimatedDurationSeconds: 12 * 3600,
        quantity: 1,
        supportUsed: false,
      },
      calibration,
    ),
    scenarioFromQuote(
      "pla-500g-24h",
      "500 g / 24 saat PLA",
      {
        filamentWeightGrams: 500,
        estimatedDurationSeconds: 24 * 3600,
        quantity: 1,
        supportUsed: false,
      },
      calibration,
    ),
    scenarioFromQuote(
      "support-none",
      "Desteksiz dilim",
      { ...cube, quantity: 1, supportUsed: false },
      calibration,
    ),
    scenarioFromQuote(
      "support-slice",
      "Destekli dilim (supportUsed, ek söküm emeği)",
      { ...cube, quantity: 1, supportUsed: true },
      calibration,
    ),
    scenarioFromQuote(
      "shipping-once",
      "Aynı siparişte kargo bir kez",
      { ...cube, quantity: 10, supportUsed: false },
      calibration,
    ),
  ];
}

export interface LaunchActivationGateResult {
  ok: boolean;
  cubeGrossMinor: number;
  cubeTargetMinor: number;
  errors: string[];
  scenarios: LaunchScenarioResult[];
}

/** Gates that must pass before owner activation. */
export function verifyLaunchActivationGates(
  calibration: PricingCalibrationInputs = LAUNCH_OWNER_CALIBRATION,
): LaunchActivationGateResult {
  const scenarios = launchVerificationScenarios(calibration);
  const cube = scenarios.find((row) => row.id === "cube-1");
  const cubeFive = scenarios.find((row) => row.id === "cube-5");
  const cubeTen = scenarios.find((row) => row.id === "cube-10");
  const errors: string[] = [];

  if (!cube) {
    errors.push("20 mm küp senaryosu eksik.");
  } else if (cube.netMinor < calibration.minimumOrderNetMinor) {
    errors.push("20 mm küp net fiyatı asgari siparişin altında.");
  } else if (cube.vatMinor !== Math.round(cube.netMinor * calibration.vatRate)) {
    errors.push("KDV net fiyata son aşamada uygulanmadı.");
  } else if (cube.grossMinor !== cube.netMinor + cube.vatMinor) {
    errors.push("Brüt, net + KDV olmalı.");
  }

  for (const row of scenarios) {
    if (row.netMinor < calibration.minimumOrderNetMinor) {
      errors.push(`${row.id} asgari netin altında.`);
    }
    if (row.shippingMinor !== COMMERCE_SHIPPING_POLICY.standardShippingMinor) {
      errors.push(`${row.id} kargosu sipariş başına bir kez ₺100 olmalı.`);
    }
    if (row.grossMinor !== row.netMinor + row.vatMinor) {
      errors.push(`${row.id} brütüne kargo veya ara KDV karışmış.`);
    }
  }

  if (
    cube &&
    cubeFive &&
    cubeTen &&
    (cube.shippingMinor !== cubeFive.shippingMinor ||
      cube.shippingMinor !== cubeTen.shippingMinor)
  ) {
    errors.push("Çok adetli siparişte kargo birden fazla kez yazıldı.");
  }

  const unsupported = scenarios.find((row) => row.id === "support-none");
  const support = scenarios.find((row) => row.id === "support-slice");
  if (!unsupported || unsupported.supportLaborMinor !== 0) {
    errors.push("Desteksiz dilimde destek söküm emeği olmamalı.");
  }
  if (!support || support.supportLaborMinor <= 0) {
    errors.push("Destekli dilimde destek söküm emeği uygulanmadı.");
  } else if (cube && support.grossMinor <= cube.grossMinor) {
    errors.push("Destekli dilim brütü, desteksiz küpten yüksek olmalı.");
  }

  const shippingOnce = scenarios.find((row) => row.id === "shipping-once");
  if (!shippingOnce || !cube || shippingOnce.shippingMinor !== cube.shippingMinor) {
    errors.push("Kargo aynı siparişte bir kez gösterilmeli.");
  }

  return {
    ok: errors.length === 0,
    cubeGrossMinor: cube?.grossMinor ?? 0,
    cubeTargetMinor: cube?.grossMinor ?? 0,
    errors,
    scenarios,
  };
}
