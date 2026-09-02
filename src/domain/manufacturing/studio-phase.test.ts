import { describe, expect, it } from "vitest";

import {
  deriveStudioPhase,
  isQuoteStale,
  stageFromJobState,
} from "@/domain/manufacturing/studio-phase";
import {
  DEFAULT_MANUFACTURING_TRANSFORM,
  normalizeTransform,
  serializeTransformForUpload,
} from "@/domain/manufacturing/transform";
import { applyBedDragDelta } from "@/domain/manufacturing/transform-math";

describe("studio phase machine", () => {
  it("walks empty → parsing → ready → quoted → stale", () => {
    expect(
      deriveStudioPhase({
        hasFile: false,
        parseStatus: "idle",
        submitting: false,
        addingToCart: false,
        cartCompleted: false,
        jobState: null,
        hasQuote: false,
        quoteStale: false,
        failed: false,
      }),
    ).toBe("empty");
    expect(
      deriveStudioPhase({
        hasFile: true,
        parseStatus: "parsing",
        submitting: false,
        addingToCart: false,
        cartCompleted: false,
        jobState: null,
        hasQuote: false,
        quoteStale: false,
        failed: false,
      }),
    ).toBe("parsing");
    expect(
      deriveStudioPhase({
        hasFile: true,
        parseStatus: "ready",
        submitting: false,
        addingToCart: false,
        cartCompleted: false,
        jobState: null,
        hasQuote: true,
        quoteStale: true,
        failed: false,
      }),
    ).toBe("stale_quote");
  });

  it("maps real job states to progress stages without fake percents", () => {
    expect(stageFromJobState("uploaded")).toBe("queued");
    expect(stageFromJobState("slicing")).toBe("slice");
    expect(stageFromJobState("pricing")).toBe("sign");
    expect(stageFromJobState("priced")).toBe("ready");
  });

  it("marks quotes stale when the production fingerprint changes", () => {
    const fingerprint = serializeTransformForUpload(DEFAULT_MANUFACTURING_TRANSFORM);
    expect(
      isQuoteStale({
        hasQuote: true,
        quoteFingerprint: fingerprint,
        currentFingerprint: fingerprint,
      }),
    ).toBe(false);
    expect(
      isQuoteStale({
        hasQuote: true,
        quoteFingerprint: fingerprint,
        currentFingerprint: `${fingerprint}:moved`,
      }),
    ).toBe(true);
  });
});

describe("direct drag transform", () => {
  it("updates bed X/Y and keeps Z, then serializes the same payload for production", () => {
    const next = applyBedDragDelta(DEFAULT_MANUFACTURING_TRANSFORM, 12.34, -8.5);
    expect(next.positionMm.z).toBe(0);
    expect(next.positionMm.x).toBe(12.34);
    expect(next.positionMm.y).toBe(-8.5);
    expect(serializeTransformForUpload(next)).toContain('"x":12.34');
    expect(serializeTransformForUpload(next)).toContain('"y":-8.5');
    expect(serializeTransformForUpload(next)).toBe(
      serializeTransformForUpload(
        normalizeTransform({
          ...DEFAULT_MANUFACTURING_TRANSFORM,
          positionMm: { x: 12.34, y: -8.5, z: 0 },
          source: "manual",
        }),
      ),
    );
  });
});
