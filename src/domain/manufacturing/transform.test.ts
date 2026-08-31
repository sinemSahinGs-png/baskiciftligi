import { describe, expect, it } from "vitest";

import {
  DEFAULT_MANUFACTURING_TRANSFORM,
  dimensionsWithinTolerance,
  manufacturingTransformSchema,
  normalizeAngleDeg,
  normalizeTransform,
  transformToWorkerArgs,
  uniformScalePercent,
} from "./transform";
import {
  canRedoTransform,
  canUndoTransform,
  commitTransformHistory,
  createTransformHistory,
  redoTransformHistory,
  undoTransformHistory,
} from "./transform-history";
import { DEVELOPMENT_PRINTER } from "./profiles";

describe("manufacturingTransformSchema", () => {
  it("accepts a valid transform", () => {
    const parsed = manufacturingTransformSchema.parse(DEFAULT_MANUFACTURING_TRANSFORM);
    expect(parsed.version).toBe(1);
    expect(parsed.scale.uniform).toBe(true);
  });

  it("rejects invalid scale", () => {
    const result = manufacturingTransformSchema.safeParse({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      scale: { x: -1, y: 1, z: 1, uniform: true },
    });
    expect(result.success).toBe(false);
  });
});

describe("normalizeAngleDeg", () => {
  it("normalizes angles into (-180, 180]", () => {
    expect(normalizeAngleDeg(370)).toBe(10);
    expect(normalizeAngleDeg(-190)).toBe(170);
    expect(normalizeAngleDeg(180)).toBe(180);
  });
});

describe("uniform scale", () => {
  it("derives percent from uniform scale", () => {
    const transform = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      scale: { x: 2, y: 2, z: 2, uniform: true },
    });
    expect(uniformScalePercent(transform)).toBe(200);
  });
});

describe("transformToWorkerArgs", () => {
  it("maps transform to worker arguments with bed center offset", () => {
    const transform = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      rotationDeg: { x: 15, y: 0, z: 90 },
      scale: { x: 1.5, y: 1.5, z: 1.5, uniform: true },
      positionMm: { x: 10, y: -5, z: 0 },
      placeOnBed: true,
    });
    const args = transformToWorkerArgs(transform, DEVELOPMENT_PRINTER.buildVolumeMm);
    expect(args.rotateX).toBe(15);
    expect(args.rotateZ).toBe(90);
    expect(args.scalePercent).toBe(150);
    expect(args.centerX).toBe(128 + 10);
    expect(args.centerY).toBe(128 - 5);
    expect(args.placeOnBed).toBe(true);
  });
});

describe("dimensionsWithinTolerance", () => {
  it("returns true when dimensions are close enough", () => {
    expect(
      dimensionsWithinTolerance(
        { x: 20, y: 20, z: 20 },
        { x: 21, y: 19.5, z: 20.2 },
      ),
    ).toBe(true);
  });

  it("returns false when any axis exceeds tolerance", () => {
    expect(
      dimensionsWithinTolerance(
        { x: 20, y: 20, z: 20 },
        { x: 24, y: 20, z: 20 },
      ),
    ).toBe(false);
  });
});

describe("transform history", () => {
  it("supports undo and redo", () => {
    const initial = createTransformHistory();
    const rotated = normalizeTransform({
      ...DEFAULT_MANUFACTURING_TRANSFORM,
      rotationDeg: { x: 0, y: 0, z: 45 },
    });
    const scaled = normalizeTransform({
      ...rotated,
      scale: { x: 2, y: 2, z: 2, uniform: true },
    });

    const afterRotate = commitTransformHistory(initial, rotated);
    const afterScale = commitTransformHistory(afterRotate, scaled);
    expect(afterScale.present.rotationDeg.z).toBe(45);
    expect(uniformScalePercent(afterScale.present)).toBe(200);

    const undone = undoTransformHistory(afterScale);
    expect(canUndoTransform(undone)).toBe(true);
    expect(uniformScalePercent(undone.present)).toBe(100);

    const redone = redoTransformHistory(undone);
    expect(canRedoTransform(redone)).toBe(false);
    expect(uniformScalePercent(redone.present)).toBe(200);
  });
});
