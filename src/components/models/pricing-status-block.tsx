"use client";

import type { CustomerPricingDisplay } from "@/domain/external-models/pricing-state";

export function PricingStatusBlock({ pricing }: { pricing: CustomerPricingDisplay }) {
  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4"
      data-pricing-state={pricing.state}
    >
      <p className="text-xs font-medium tracking-wide text-muted-light uppercase">
        {pricing.labelTr}
      </p>
      <p className="mt-2 font-heading text-lg font-semibold leading-snug text-light-text sm:text-xl">
        {pricing.mainTextTr}
      </p>
      {pricing.supportingTextTr ? (
        <p className="mt-2 text-xs leading-5 text-muted-light">{pricing.supportingTextTr}</p>
      ) : null}
      {pricing.state === "analysed" && pricing.exactGrossMinor != null ? (
        <p className="sr-only">
          Hesaplanan fiyat: {pricing.mainTextTr}
        </p>
      ) : null}
    </div>
  );
}
