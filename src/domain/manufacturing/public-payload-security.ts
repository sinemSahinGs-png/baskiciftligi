/** Keys that must never appear in public/customer API payloads. */
export const FORBIDDEN_PUBLIC_COST_KEYS = [
  "internal",
  "internalBreakdown",
  "directCostMinor",
  "riskAdjustedCostMinor",
  "riskRate",
  "targetMarginRate",
  "profitMinor",
  "machineHourlyRateMinor",
  "materialPricePerGramMinor",
  "depreciationHours",
  "depreciation",
  "maintenanceMinor",
  "maintenanceBasis",
  "laborHourlyMinor",
  "laborCostMinor",
  "packagingMinor",
  "packagingBasis",
  "packagingFeeMinor",
  "netSellingPriceMinor",
  "setupFeeMinor",
  "postProcessingFeeMinor",
  "supportHandlingFeeMinor",
  "modelReviewFeeMinor",
  "rates",
  "calibration",
  "pricingAuditLog",
] as const;

export type ForbiddenPublicCostKey = (typeof FORBIDDEN_PUBLIC_COST_KEYS)[number];

export interface ForbiddenPublicFieldHit {
  path: string;
  key: ForbiddenPublicCostKey | string;
}

export function findForbiddenPublicCostFields(
  value: unknown,
  path = "$",
): ForbiddenPublicFieldHit[] {
  if (value === null || typeof value !== "object") {
    return [];
  }

  const hits: ForbiddenPublicFieldHit[] = [];

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      hits.push(...findForbiddenPublicCostFields(item, `${path}[${index}]`));
    });
    return hits;
  }

  for (const [key, nested] of Object.entries(value)) {
    const nextPath = `${path}.${key}`;
    if ((FORBIDDEN_PUBLIC_COST_KEYS as readonly string[]).includes(key)) {
      hits.push({ path: nextPath, key });
    }
    hits.push(...findForbiddenPublicCostFields(nested, nextPath));
  }

  return hits;
}

export function assertPublicPayloadSafe(value: unknown): void {
  const hits = findForbiddenPublicCostFields(value);
  if (hits.length > 0) {
    const summary = hits.map((hit) => `${hit.path} (${hit.key})`).join(", ");
    throw new Error(`Public payload contains forbidden cost fields: ${summary}`);
  }
}
