import { createHmac, timingSafeEqual } from "node:crypto";

import { assertMinorUnits } from "@/lib/money";
import type { PrintConfiguration } from "@/domain/manufacturing/types";
import { serializeTransformForUpload } from "@/domain/manufacturing/transform";

export interface QuoteSignaturePayload {
  quoteId: string;
  jobId: string;
  fileChecksum: string;
  grossMinor: number;
  netMinor: number;
  vatMinor: number;
  configuration: PrintConfiguration;
  pricingVersion: number;
  pricingChecksum: string;
  slicerProfileChecksum: string;
  expiresAt: string;
}

export function canonicalConfiguration(configuration: PrintConfiguration): string {
  return [
    configuration.printerProfileId,
    configuration.printerProfileVersion,
    configuration.materialId,
    configuration.colorId,
    configuration.qualityId,
    configuration.infillPercent,
    configuration.supports,
    configuration.scalePercent,
    configuration.quantity,
    configuration.unit,
    configuration.customScale ?? "",
    configuration.manufacturingTransform
      ? serializeTransformForUpload(configuration.manufacturingTransform)
      : "",
  ].join("|");
}

export function signQuote(payload: QuoteSignaturePayload, secret: string): string {
  assertMinorUnits(payload.grossMinor);
  assertMinorUnits(payload.netMinor);
  assertMinorUnits(payload.vatMinor);
  const body = [
    payload.quoteId,
    payload.jobId,
    payload.fileChecksum,
    payload.grossMinor,
    payload.netMinor,
    payload.vatMinor,
    canonicalConfiguration(payload.configuration),
    payload.pricingVersion,
    payload.pricingChecksum,
    payload.slicerProfileChecksum,
    payload.expiresAt,
  ].join("\n");
  return createHmac("sha256", secret).update(body).digest("hex");
}

export function verifyQuoteSignature(
  payload: QuoteSignaturePayload,
  signature: string,
  secret: string,
): boolean {
  const expected = signQuote(payload, secret);
  const left = Buffer.from(expected, "hex");
  const right = Buffer.from(signature, "hex");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function configurationsMatch(
  left: PrintConfiguration,
  right: PrintConfiguration,
): boolean {
  return canonicalConfiguration(left) === canonicalConfiguration(right);
}
