import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { computeCartShippingMinor } from "@/domain/commerce/shipping-policy";
import { analyzeMesh } from "@/domain/manufacturing/mesh";
import { DEVELOPMENT_PRINTER } from "@/domain/manufacturing/profiles";
import { reuseQuoteJobIfDuplicate } from "@/domain/manufacturing/quote-idempotency";
import { isQuoteStale } from "@/domain/manufacturing/studio-phase";
import {
  DEFAULT_MANUFACTURING_TRANSFORM,
  serializeTransformForUpload,
} from "@/domain/manufacturing/transform";
import { applyBedDragDelta } from "@/domain/manufacturing/transform-math";
import type { QuoteJobRecord } from "@/domain/manufacturing/types";

const build = DEVELOPMENT_PRINTER.buildVolumeMm;

describe("studio production pipeline contract", () => {
  it("parses STL and 3MF fixtures to the same bounding box language as the worker", () => {
    const stl = analyzeMesh({
      filename: "cube.stl",
      bytes: new Uint8Array(readFileSync(path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.stl"))),
      buildVolumeMm: build,
    });
    const threeMf = analyzeMesh({
      filename: "cube.3mf",
      bytes: new Uint8Array(readFileSync(path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.3mf"))),
      buildVolumeMm: build,
    });
    expect(stl.dimensionsMm.x).toBe(20);
    expect(threeMf.dimensionsMm.x).toBe(20);
    expect(threeMf.triangleCount).toBe(stl.triangleCount);
  });

  it("marks a signed quote stale after a production transform change", () => {
    const quoted = serializeTransformForUpload(DEFAULT_MANUFACTURING_TRANSFORM);
    const dragged = serializeTransformForUpload(applyBedDragDelta(DEFAULT_MANUFACTURING_TRANSFORM, 15, 4));
    expect(
      isQuoteStale({
        hasQuote: true,
        quoteFingerprint: `${quoted}:standart:20:auto:1`,
        currentFingerprint: `${dragged}:standart:20:auto:1`,
      }),
    ).toBe(true);
  });

  it("reuses the same job for an identical idempotency key", () => {
    const existing = { id: "job-1" } as QuoteJobRecord;
    const first = reuseQuoteJobIfDuplicate(existing, "file-a");
    const second = reuseQuoteJobIfDuplicate(existing, "file-a");
    expect(first?.jobId).toBe("job-1");
    expect(second?.jobId).toBe(first?.jobId);
  });

  it("charges 100 TL shipping once even with two manufacturing subtotals", () => {
    expect(computeCartShippingMinor(14_648)).toBe(10_000);
    expect(computeCartShippingMinor(14_648 + 14_648)).toBe(10_000);
  });
});
