import type { Vec3Mm } from "@/domain/manufacturing/types";
import type { ManufacturingTransform } from "@/domain/manufacturing/transform";
import {
  DEFAULT_MANUFACTURING_TRANSFORM,
  normalizeTransform,
  uniformScalePercent,
} from "@/domain/manufacturing/transform";
import {
  computeOrientedBounds,
  placeOnBedTransform,
} from "@/domain/manufacturing/transform-math";

/** PrusaSlicer CLI applies transforms in this order before ensure-on-bed. */
export const WORKER_TRANSFORM_ORDER = [
  "scale",
  "rotate_z",
  "rotate_y",
  "rotate_x",
  "center_xy",
  "ensure_on_bed",
] as const;

export type TransformValidationCode =
  | "non_uniform_scale"
  | "floating_model"
  | "unsupported_transform";

export type TransformValidationResult =
  | { ok: true }
  | { ok: false; code: TransformValidationCode; message: string };

export interface WorkerSliceTransformArgs {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scalePercent: number;
  centerX: number;
  centerY: number;
  ensureOnBed: boolean;
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function rawDimensionsFromAnalysis(
  dimensionsMm: Vec3Mm,
  scalePercent: number,
): Vec3Mm {
  const factor = scalePercent / 100;
  if (!(factor > 0)) {
    return dimensionsMm;
  }
  return {
    x: round3(dimensionsMm.x / factor),
    y: round3(dimensionsMm.y / factor),
    z: round3(dimensionsMm.z / factor),
  };
}

export function resolveEffectiveTransform(
  transform: ManufacturingTransform,
  rawDimensionsMm: Vec3Mm,
): ManufacturingTransform {
  const normalized = normalizeTransform(transform);
  if (normalized.placeOnBed) {
    return placeOnBedTransform(normalized, rawDimensionsMm);
  }
  return normalized;
}

export function validateTransformForSlicing(
  transform: ManufacturingTransform | null | undefined,
): TransformValidationResult {
  if (!transform) {
    return { ok: true };
  }
  const normalized = normalizeTransform(transform);
  if (!normalized.scale.uniform) {
    return {
      ok: false,
      code: "non_uniform_scale",
      message:
        "Eksen bazlı farklı ölçekleme otomatik analizde desteklenmiyor. Manuel inceleme gerekir.",
    };
  }
  const { x, y, z } = normalized.scale;
  if (Math.abs(x - y) > 0.0001 || Math.abs(y - z) > 0.0001) {
    return {
      ok: false,
      code: "non_uniform_scale",
      message:
        "Eksen bazlı farklı ölçekleme otomatik analizde desteklenmiyor. Manuel inceleme gerekir.",
    };
  }
  if (!normalized.placeOnBed) {
    return {
      ok: false,
      code: "floating_model",
      message:
        "Otomatik fiyat için modelin plakaya oturtulması gerekir. “Plakaya oturt” seçeneğini açın veya manuel inceleme isteyin.",
    };
  }
  return { ok: true };
}

export function computeExpectedSlicedDimensions(
  rawDimensionsMm: Vec3Mm,
  transform: ManufacturingTransform,
): Vec3Mm {
  const effective = resolveEffectiveTransform(transform, rawDimensionsMm);
  return computeOrientedBounds(rawDimensionsMm, effective).dimensions;
}

export function transformToWorkerSliceArgs(
  transform: ManufacturingTransform | null | undefined,
  buildVolumeMm: Vec3Mm,
  rawDimensionsMm: Vec3Mm,
): WorkerSliceTransformArgs {
  const normalized = normalizeTransform(transform ?? DEFAULT_MANUFACTURING_TRANSFORM);
  const effective = resolveEffectiveTransform(normalized, rawDimensionsMm);
  const bedCenterX = buildVolumeMm.x / 2;
  const bedCenterY = buildVolumeMm.y / 2;
  return {
    rotateX: effective.rotationDeg.x,
    rotateY: effective.rotationDeg.y,
    rotateZ: effective.rotationDeg.z,
    scalePercent: uniformScalePercent(effective),
    centerX: round3(bedCenterX + effective.positionMm.x),
    centerY: round3(bedCenterY + effective.positionMm.y),
    ensureOnBed: effective.placeOnBed,
  };
}

export function mapTransformValidationToReviewFlag(
  code: TransformValidationCode,
): "slicer_failure" | "ambiguous_orientation" {
  return code === "non_uniform_scale" ? "ambiguous_orientation" : "slicer_failure";
}
