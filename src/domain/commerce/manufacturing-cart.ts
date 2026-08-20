import { assertMinorUnits } from "@/lib/money";
import type { PricedCartLine } from "@/domain/commerce/cart-pricing";
import type { ManufacturingQuoteRecord } from "@/domain/manufacturing/types";
import { quotePurchasable } from "@/domain/manufacturing/quote-service";
import { verifyQuoteSignature } from "@/domain/manufacturing/quote-sign";
import { quoteHmacSecret } from "@/lib/manufacturing/paths";
import { qualityLabel } from "@/domain/manufacturing/profiles";

function quoteVerifySecret() {
  try {
    return quoteHmacSecret();
  } catch {
    return "";
  }
}

export function pricedManufacturingLine(
  quote: ManufacturingQuoteRecord,
  options?: { revoked?: boolean },
): PricedCartLine {
  const signatureOk = verifyQuoteSignature(
    {
      quoteId: quote.id,
      jobId: quote.jobId,
      fileChecksum: quote.fileChecksum,
      grossMinor: quote.publicBreakdown.grossMinor,
      netMinor: quote.publicBreakdown.netMinor,
      vatMinor: quote.publicBreakdown.vatMinor,
      configuration: quote.configuration,
      pricingVersion: quote.pricingVersion,
      pricingChecksum: quote.pricingChecksum,
      slicerProfileChecksum: quote.slicerProfileChecksum,
      expiresAt: quote.expiresAt,
    },
    quote.signature,
    quoteVerifySecret(),
  );
  const expired = Date.parse(quote.expiresAt) <= Date.now() || quote.status === "expired";
  const licenseBlocked =
    quote.provenance.source === "thingiverse" && !quotePurchasable(quote);
  const revoked = options?.revoked ?? false;
  const available =
    signatureOk &&
    !expired &&
    !licenseBlocked &&
    quote.status !== "cancelled" &&
    !revoked;
  const displayKind =
    quote.provenance.source === "thingiverse" ? "licensed" : "uploaded";
  const name =
    quote.provenance.thingTitle ?? quote.provenance.selectedFilename ?? "Özel üretim";

  return {
    key: `mfq:${quote.id}`,
    productId: `mfq:${quote.id}`,
    variantId: null,
    name,
    variantName: [
      quote.configuration.materialId.toUpperCase(),
      qualityLabel(quote.configuration.qualityId),
      `%${quote.configuration.infillPercent}`,
    ].join(" · "),
    slug: "",
    imageUrl: null,
    unitPriceMinor: available ? quote.publicBreakdown.grossMinor : 0,
    lineTotalMinor: available
      ? assertMinorUnits(quote.publicBreakdown.grossMinor)
      : 0,
    quantity: quote.configuration.quantity,
    availableQuantity: available ? quote.configuration.quantity : 0,
    isAvailable: available,
    productionLeadTimeDays: { min: 3, max: 10 },
    isDemo: quote.pricingChecksum.startsWith("") && process.env.NODE_ENV !== "production",
    kind: "made_to_order",
    displayKind,
    quoteId: quote.id,
    manufacturing: {
      source: quote.provenance.source,
      filename: quote.provenance.selectedFilename,
      thingTitle: quote.provenance.thingTitle,
      selectedFileName: quote.provenance.selectedFilename,
      dimensionsMm: quote.metrics.dimensionsMm,
      material: quote.configuration.materialId.toUpperCase(),
      color: quote.configuration.colorId,
      quality: qualityLabel(quote.configuration.qualityId),
      infillPercent: quote.configuration.infillPercent,
      supports: quote.configuration.supports,
      estimatedDurationSeconds: quote.metrics.estimatedDurationSeconds,
      vatMinor: quote.publicBreakdown.vatMinor,
      netMinor: quote.publicBreakdown.netMinor,
      reviewRequired: quote.reviewRequired,
      quoteExpiresAt: quote.expiresAt,
      attributionText: quote.provenance.attributionText,
      licenseLabel: quote.provenance.licenseName,
    },
  };
}
