/** Owner-approved launch commerce shipping policy — single source of truth. */
export const COMMERCE_SHIPPING_POLICY_VERSION = 2 as const;

export interface CommerceShippingPolicy {
  version: typeof COMMERCE_SHIPPING_POLICY_VERSION;
  currency: "TRY";
  standardShippingMinor: number;
  /** Null or 0 means there is no free-shipping threshold. */
  freeShippingThresholdMinor: number | null;
}

export const COMMERCE_SHIPPING_POLICY: CommerceShippingPolicy = {
  version: COMMERCE_SHIPPING_POLICY_VERSION,
  currency: "TRY",
  standardShippingMinor: 10_000,
  freeShippingThresholdMinor: null,
};

/** Null or 0 disables the free-shipping threshold. It is not "always free". */
export function freeShippingThresholdDisabled(
  thresholdMinor: number | null | undefined,
): boolean {
  return thresholdMinor == null || thresholdMinor <= 0;
}

function normalizedFreeShippingThresholdMinor(): number {
  return COMMERCE_SHIPPING_POLICY.freeShippingThresholdMinor ?? 0;
}

/** Cart-level shipping from server-calculated subtotal (integer minor units). */
export function computeCartShippingMinor(subtotalMinor: number): number {
  if (!Number.isSafeInteger(subtotalMinor) || subtotalMinor < 0) {
    throw new RangeError("Sepet ara toplamı geçerli bir tam sayı olmalıdır.");
  }
  if (subtotalMinor === 0) {
    return 0;
  }
  const threshold = normalizedFreeShippingThresholdMinor();
  if (!freeShippingThresholdDisabled(threshold) && subtotalMinor >= threshold) {
    return 0;
  }
  return COMMERCE_SHIPPING_POLICY.standardShippingMinor;
}

/** Customer-safe shipping policy fields for public API responses. */
export function publicShippingPolicyFields() {
  return {
    currency: COMMERCE_SHIPPING_POLICY.currency,
    standardShippingMinor: COMMERCE_SHIPPING_POLICY.standardShippingMinor,
    freeShippingThresholdMinor: normalizedFreeShippingThresholdMinor(),
    policyVersion: COMMERCE_SHIPPING_POLICY.version,
    chargedOncePerShipment: true,
    includedInProductPrice: false,
  };
}
