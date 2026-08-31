import { describe, expect, it } from "vitest";

import {
  computeExpectedSlicedDimensions,
  normalizeTransform,
  transformToWorkerSliceArgs,
  validateTransformForSlicing,
} from "./transform-pipeline.mjs";
import { parseGcodeBounds } from "./parse-gcode-bounds.mjs";
import {
  computeExpectedSlicedDimensions as tsExpected,
  transformToWorkerSliceArgs as tsArgs,
  validateTransformForSlicing as tsValidate,
} from "../../../src/domain/manufacturing/transform-pipeline.ts";
import {
  DEFAULT_MANUFACTURING_TRANSFORM,
  normalizeTransform as tsNormalize,
} from "../../../src/domain/manufacturing/transform.ts";
import { DEVELOPMENT_PRINTER } from "../../../src/domain/manufacturing/profiles.ts";

const cuboid = { x: 20, y: 30, z: 40 };

describe("worker transform-pipeline alignment", () => {
  it("matches TypeScript slice args for rotated scaled cuboid", () => {
    const transform = tsNormalize({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      rotationDeg: { x: 0, y: 0, z: 90 },
      scale: { x: 0.5, y: 0.5, z: 0.5, uniform: true },
      positionMm: { x: 5, y: -3, z: 0 },
      placeOnBed: true,
    });
    const workerArgs = transformToWorkerSliceArgs(
      transform,
      DEVELOPMENT_PRINTER.buildVolumeMm,
      cuboid,
    );
    const tsSliceArgs = tsArgs(
      transform,
      DEVELOPMENT_PRINTER.buildVolumeMm,
      cuboid,
    );
    expect(workerArgs).toEqual(tsSliceArgs);
    expect(computeExpectedSlicedDimensions(cuboid, transform)).toEqual(
      tsExpected(cuboid, transform),
    );
  });

  it("matches validation codes", () => {
    const bad = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      scale: { x: 1, y: 1.1, z: 1, uniform: false },
    });
    const workerResult = validateTransformForSlicing(bad);
    const tsResult = tsValidate(
      tsNormalize({
        ...DEFAULT_MANUFACTURING_TRANSFORM,
        scale: { x: 1, y: 1.1, z: 1, uniform: false },
      }),
    );
    expect(workerResult.ok).toBe(false);
    expect(tsResult.ok).toBe(false);
    if (!workerResult.ok && !tsResult.ok) {
      expect(workerResult.code).toBe(tsResult.code);
    }
  });
});

describe("parseGcodeBounds", () => {
  it("derives axis-aligned bounds from G-code moves", () => {
    const gcode = [
      "G90",
      "G1 X0 Y0 Z0.2",
      "G1 X20 Y0",
      "G1 X20 Y30",
      "G1 X0 Y30",
      "G1 X0 Y0",
    ].join("\n");
    const bounds = parseGcodeBounds(gcode);
    expect(bounds.dimensions.x).toBeCloseTo(20, 1);
    expect(bounds.dimensions.y).toBeCloseTo(30, 1);
    expect(bounds.min.z).toBeCloseTo(0.2, 2);
  });
});
