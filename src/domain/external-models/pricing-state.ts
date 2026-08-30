import { formatMoney } from "@/lib/money";

export const PRICING_STATES = ["unanalysed", "rough_range", "analysed"] as const;

export type PricingState = (typeof PRICING_STATES)[number];

export interface ManufacturingAnalysis {
  /** Verified slicer/manufacturing metrics exist for this model. */
  hasSlicerAnalysis: boolean;
  /** Exact gross price in minor units (kuruş) from verified analysis. */
  analysedGrossMinor?: number | null;
  /** Defensible rough range from backend geometry heuristics (not size presets alone). */
  roughRangeMinMinor?: number | null;
  roughRangeMaxMinor?: number | null;
}

export interface CustomerPricingDisplay {
  state: PricingState;
  labelTr: string;
  mainTextTr: string;
  supportingTextTr?: string;
  exactGrossMinor?: number;
  rangeMinMinor?: number;
  rangeMaxMinor?: number;
}

export const PRICING_STATE_LABELS: Record<PricingState, string> = {
  unanalysed: "Fiyat analizi gerekli",
  rough_range: "Yaklaşık fiyat aralığı",
  analysed: "Hesaplanan üretim fiyatı",
};

export function resolveCustomerPricing(
  analysis: ManufacturingAnalysis,
): CustomerPricingDisplay {
  const analysedMinor = analysis.analysedGrossMinor;
  if (
    analysis.hasSlicerAnalysis &&
    analysedMinor != null &&
    Number.isFinite(analysedMinor) &&
    analysedMinor > 0
  ) {
    return {
      state: "analysed",
      labelTr: PRICING_STATE_LABELS.analysed,
      mainTextTr: formatMoney(analysedMinor),
      supportingTextTr: "Doğrulanmış baskı analizine göre hesaplandı.",
      exactGrossMinor: analysedMinor,
    };
  }

  const min = analysis.roughRangeMinMinor;
  const max = analysis.roughRangeMaxMinor;
  if (
    min != null &&
    max != null &&
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    min > 0 &&
    max >= min
  ) {
    return {
      state: "rough_range",
      labelTr: PRICING_STATE_LABELS.rough_range,
      mainTextTr: `${formatMoney(min)}–${formatMoney(max)}`,
      supportingTextTr: "Model geometrisi ve baskı süresine göre değişebilir.",
      rangeMinMinor: min,
      rangeMaxMinor: max,
    };
  }

  return {
    state: "unanalysed",
    labelTr: PRICING_STATE_LABELS.unanalysed,
    mainTextTr: "Dosya ve baskı detayları incelendikten sonra net fiyat hesaplanır.",
  };
}

/** Community / preset-only flows require an uploaded file before pricing. */
export function communityModelPricing(): CustomerPricingDisplay {
  return {
    state: "unanalysed",
    labelTr: "Fiyat için dosya gerekli",
    mainTextTr:
      "Dosya analizinden sonra malzeme kullanımı, baskı süresi ve üretim detaylarına göre net fiyat hesaplanır.",
  };
}

export function pricingStateLabel(state: PricingState): string {
  return PRICING_STATE_LABELS[state];
}
