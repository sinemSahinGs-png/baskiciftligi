/** Owner-approved launch commerce shipping policy — single source of truth. */
export const COMMERCE_SHIPPING_POLICY_VERSION = 1 as const;

export interface CommerceShippingPolicy {
  version: typeof COMMERCE_SHIPPING_POLICY_VERSION;
  currency: "TRY";
  standardShippingMinor: number;
  freeShippingThresholdMinor: number;
}

export const COMMERCE_SHIPPING_POLICY: CommerceShippingPolicy = {
  version: COMMERCE_SHIPPING_POLICY_VERSION,
  currency: "TRY",
  standardShippingMinor: 8_990,
  freeShippingThresholdMinor: 150_000,
};

/** Cart-level shipping from server-calculated subtotal (integer minor units). */
export function computeCartShippingMinor(subtotalMinor: number): number {
  if (!Number.isSafeInteger(subtotalMinor) || subtotalMinor < 0) {
    throw new RangeError("Sepet ara toplamı geçerli bir tam sayı olmalıdır.");
  }
  if (subtotalMinor === 0) {
    return 0;
  }
  if (subtotalMinor >= COMMERCE_SHIPPING_POLICY.freeShippingThresholdMinor) {
    return 0;
  }
  return COMMERCE_SHIPPING_POLICY.standardShippingMinor;
}

/** Customer-safe shipping policy fields for public API responses. */
export function publicShippingPolicyFields() {
  return {
    currency: COMMERCE_SHIPPING_POLICY.currency,
    standardShippingMinor: COMMERCE_SHIPPING_POLICY.standardShippingMinor,
    freeShippingThresholdMinor: COMMERCE_SHIPPING_POLICY.freeShippingThresholdMinor,
    policyVersion: COMMERCE_SHIPPING_POLICY.version,
  };
}
