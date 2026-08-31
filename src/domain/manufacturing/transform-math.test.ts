import { describe, expect, it } from "vitest";

import { DEFAULT_MANUFACTURING_TRANSFORM, normalizeTransform } from "./transform";
import {
  centerOnPlateTransform,
  computeOrientedBounds,
  placeOnBedTransform,
} from "./transform-math";
import { DEVELOPMENT_PRINTER } from "./profiles";

const cube = { x: 20, y: 30, z: 40 };

describe("computeOrientedBounds", () => {
  it("swaps dimensions after a 90° Z rotation", () => {
    const transform = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      rotationDeg: { x: 0, y: 0, z: 90 },
    });
    const bounds = computeOrientedBounds(cube, transform);
    expect(bounds.dimensions.x).toBeCloseTo(30, 1);
    expect(bounds.dimensions.y).toBeCloseTo(20, 1);
    expect(bounds.dimensions.z).toBeCloseTo(40, 1);
  });
});

describe("placeOnBedTransform", () => {
  it("raises the model so the lowest point sits on Z=0", () => {
    const transform = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      positionMm: { x: 0, y: 0, z: 5 },
      placeOnBed: true,
    });
    const placed = placeOnBedTransform(transform, cube);
    const bounds = computeOrientedBounds(cube, placed);
    expect(bounds.min.z).toBeCloseTo(0, 2);
  });
});

describe("centerOnPlateTransform", () => {
  it("centers the model on the build plate", () => {
    const transform = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      positionMm: { x: 40, y: 20, z: 0 },
    });
    const centered = centerOnPlateTransform(
      transform,
      cube,
      DEVELOPMENT_PRINTER.buildVolumeMm,
    );
    const bounds = computeOrientedBounds(cube, centered);
    const bed = DEVELOPMENT_PRINTER.buildVolumeMm;
    const centerX = (bounds.min.x + bounds.max.x) / 2;
    const centerY = (bounds.min.y + bounds.max.y) / 2;
    expect(centerX).toBeCloseTo(bed.x / 2, 1);
    expect(centerY).toBeCloseTo(bed.y / 2, 1);
    expect(bounds.min.z).toBeCloseTo(0, 2);
  });
});
