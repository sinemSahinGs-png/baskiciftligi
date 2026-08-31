import { describe, expect, it } from "vitest";

import {
  DEFAULT_MANUFACTURING_TRANSFORM,
  dimensionsWithinTolerance,
  normalizeTransform,
  transformFromLegacyScalePercent,
  TRANSFORM_MISMATCH_TOLERANCE_MM,
} from "./transform";
import {
  computeExpectedSlicedDimensions,
  rawDimensionsFromAnalysis,
  resolveEffectiveTransform,
  transformToWorkerSliceArgs,
  validateTransformForSlicing,
  WORKER_TRANSFORM_ORDER,
} from "./transform-pipeline";
import { computeOrientedBounds } from "./transform-math";
import { DEVELOPMENT_PRINTER } from "./profiles";

const cuboid = { x: 20, y: 30, z: 40 };

describe("WORKER_TRANSFORM_ORDER", () => {
  it("documents deterministic PrusaSlicer transform order", () => {
    expect(WORKER_TRANSFORM_ORDER).toEqual([
      "scale",
      "rotate_z",
      "rotate_y",
      "rotate_x",
      "center_xy",
      "ensure_on_bed",
    ]);
  });
});

describe("rotated cuboid + placeOnBed", () => {
  it("places minimum Z at zero after effective transform", () => {
    const transform = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      rotationDeg: { x: 0, y: 0, z: 90 },
      placeOnBed: true,
    });
    const effective = resolveEffectiveTransform(transform, cuboid);
    const bounds = computeOrientedBounds(cuboid, effective);
    expect(bounds.min.z).toBeCloseTo(0, 2);
    expect(bounds.dimensions.x).toBeCloseTo(30, 1);
    expect(bounds.dimensions.y).toBeCloseTo(20, 1);
  });
});

describe("rotation + 50% uniform scale + placeOnBed", () => {
  it("halves oriented dimensions when axis-aligned", () => {
    const transform = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      scale: { x: 0.5, y: 0.5, z: 0.5, uniform: true },
      placeOnBed: true,
    });
    const expected = computeExpectedSlicedDimensions(cuboid, transform);
    expect(expected.x).toBeCloseTo(10, 1);
    expect(expected.y).toBeCloseTo(15, 1);
    expect(expected.z).toBeCloseTo(20, 1);
    const effective = resolveEffectiveTransform(transform, cuboid);
    expect(computeOrientedBounds(cuboid, effective).min.z).toBeCloseTo(0, 2);
  });

  it("keeps bed contact after X rotation at 50% scale", () => {
    const transform = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      rotationDeg: { x: 15, y: 0, z: 0 },
      scale: { x: 0.5, y: 0.5, z: 0.5, uniform: true },
      placeOnBed: true,
    });
    const effective = resolveEffectiveTransform(transform, cuboid);
    expect(computeOrientedBounds(cuboid, effective).min.z).toBeCloseTo(0, 2);
  });

  it("maps to worker slice args with 50% scale", () => {
    const transform = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      scale: { x: 0.5, y: 0.5, z: 0.5, uniform: true },
      placeOnBed: true,
    });
    const args = transformToWorkerSliceArgs(
      transform,
      DEVELOPMENT_PRINTER.buildVolumeMm,
      cuboid,
    );
    expect(args.scalePercent).toBe(50);
    expect(args.ensureOnBed).toBe(true);
  });
});

describe("XY positioning", () => {
  it("offsets PrusaSlicer center from bed midpoint", () => {
    const transform = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      positionMm: { x: 12, y: -8, z: 0 },
      placeOnBed: true,
    });
    const args = transformToWorkerSliceArgs(
      transform,
      DEVELOPMENT_PRINTER.buildVolumeMm,
      cuboid,
    );
    expect(args.centerX).toBe(140);
    expect(args.centerY).toBe(120);
  });
});

describe("legacy scale-only upload", () => {
  it("derives raw dimensions from scaled analysis", () => {
    const legacy = transformFromLegacyScalePercent(150);
    const scaledAnalysis = {
      x: cuboid.x * 1.5,
      y: cuboid.y * 1.5,
      z: cuboid.z * 1.5,
    };
    const raw = rawDimensionsFromAnalysis(scaledAnalysis, 150);
    expect(raw).toEqual(cuboid);
    const expected = computeExpectedSlicedDimensions(raw, legacy);
    expect(expected.x).toBeCloseTo(scaledAnalysis.x, 1);
  });
});

describe("validateTransformForSlicing", () => {
  it("rejects non-uniform scale instead of silently coercing", () => {
    const result = validateTransformForSlicing(
      normalizeTransform({
        ...DEFAULT_MANUFACTURING_TRANSFORM,
        scale: { x: 1, y: 1.2, z: 1, uniform: false },
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("non_uniform_scale");
    }
  });

  it("rejects floating models when placeOnBed is disabled", () => {
    const result = validateTransformForSlicing(
      normalizeTransform({
        ...DEFAULT_MANUFACTURING_TRANSFORM,
        placeOnBed: false,
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("floating_model");
    }
  });
});

describe("transform mismatch / manual review tolerance", () => {
  it("flags mismatch when worker bounds diverge beyond tolerance", () => {
    const transform = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      rotationDeg: { x: 0, y: 0, z: 90 },
      placeOnBed: true,
    });
    const expected = computeExpectedSlicedDimensions(cuboid, transform);
    const workerReport = { x: expected.x, y: expected.y, z: expected.z + 5 };
    expect(
      dimensionsWithinTolerance(expected, workerReport, TRANSFORM_MISMATCH_TOLERANCE_MM),
    ).toBe(false);
  });

  it("accepts worker bounds within tolerance", () => {
    const transform = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      placeOnBed: true,
    });
    const expected = computeExpectedSlicedDimensions(cuboid, transform);
    const workerReport = {
      x: expected.x + 1,
      y: expected.y - 1,
      z: expected.z + 0.5,
    };
    expect(
      dimensionsWithinTolerance(expected, workerReport, TRANSFORM_MISMATCH_TOLERANCE_MM),
    ).toBe(true);
  });
});
