import { z } from "zod";

import type { Vec3Mm } from "@/domain/manufacturing/types";
import { transformToWorkerSliceArgs } from "@/domain/manufacturing/transform-pipeline";

export const TRANSFORM_SOURCES = [
  "manual",
  "lay_flat",
  "auto_orient",
  "reset",
  "fit_volume",
] as const;

export type TransformSource = (typeof TRANSFORM_SOURCES)[number];

export const manufacturingTransformSchema = z.object({
  version: z.literal(1),
  rotationDeg: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    z: z.number().finite(),
  }),
  scale: z.object({
    x: z.number().positive().finite().max(10),
    y: z.number().positive().finite().max(10),
    z: z.number().positive().finite().max(10),
    uniform: z.boolean(),
  }),
  positionMm: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    z: z.number().finite(),
  }),
  placeOnBed: z.boolean(),
  source: z.enum(TRANSFORM_SOURCES),
});

export type ManufacturingTransform = z.infer<typeof manufacturingTransformSchema>;

export const DEFAULT_MANUFACTURING_TRANSFORM: ManufacturingTransform = {
  version: 1,
  rotationDeg: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1, uniform: true },
  positionMm: { x: 0, y: 0, z: 0 },
  placeOnBed: true,
  source: "manual",
};

export function normalizeAngleDeg(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  let angle = value % 360;
  if (angle > 180) angle -= 360;
  if (angle <= -180) angle += 360;
  return Math.round(angle * 1000) / 1000;
}

export function normalizeTransform(
  transform: ManufacturingTransform,
): ManufacturingTransform {
  return {
    version: 1,
    rotationDeg: {
      x: normalizeAngleDeg(transform.rotationDeg.x),
      y: normalizeAngleDeg(transform.rotationDeg.y),
      z: normalizeAngleDeg(transform.rotationDeg.z),
    },
    scale: {
      x: clampScale(transform.scale.x),
      y: clampScale(transform.scale.y),
      z: clampScale(transform.scale.z),
      uniform: transform.scale.uniform,
    },
    positionMm: {
      x: roundMm(transform.positionMm.x),
      y: roundMm(transform.positionMm.y),
      z: roundMm(transform.positionMm.z),
    },
    placeOnBed: transform.placeOnBed,
    source: transform.source,
  };
}

function clampScale(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(10, Math.max(0.01, Math.round(value * 10000) / 10000));
}

function roundMm(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

export function parseManufacturingTransform(
  raw: unknown,
): ManufacturingTransform | null {
  const parsed = manufacturingTransformSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  return normalizeTransform(parsed.data);
}

export function uniformScalePercent(transform: ManufacturingTransform): number {
  const factor = transform.scale.uniform
    ? transform.scale.x
    : (transform.scale.x + transform.scale.y + transform.scale.z) / 3;
  return Math.round(factor * 100);
}

export function transformFromLegacyScalePercent(scalePercent: number): ManufacturingTransform {
  const factor = Math.max(0.01, Math.min(10, scalePercent / 100));
  return normalizeTransform({
    ...DEFAULT_MANUFACTURING_TRANSFORM,
    scale: { x: factor, y: factor, z: factor, uniform: true },
  });
}

export interface WorkerTransformArgs {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scalePercent: number;
  centerX: number;
  centerY: number;
  placeOnBed: boolean;
}

/** @deprecated Prefer transformToWorkerSliceArgs from transform-pipeline with raw mesh dims. */
export function transformToWorkerArgs(
  transform: ManufacturingTransform,
  buildVolumeMm: Vec3Mm,
): WorkerTransformArgs {
  const args = transformToWorkerSliceArgs(transform, buildVolumeMm, { x: 1, y: 1, z: 1 });
  return {
    rotateX: args.rotateX,
    rotateY: args.rotateY,
    rotateZ: args.rotateZ,
    scalePercent: args.scalePercent,
    centerX: args.centerX,
    centerY: args.centerY,
    placeOnBed: args.ensureOnBed,
  };
}

export function serializeTransformForUpload(
  transform: ManufacturingTransform,
): string {
  return JSON.stringify(normalizeTransform(transform));
}

export function transformsEqual(
  left: ManufacturingTransform,
  right: ManufacturingTransform,
): boolean {
  return (
    serializeTransformForUpload(left) === serializeTransformForUpload(right)
  );
}

export const TRANSFORM_MISMATCH_TOLERANCE_MM = 1.5;

export function dimensionsWithinTolerance(
  preview: Vec3Mm,
  worker: Vec3Mm,
  toleranceMm = TRANSFORM_MISMATCH_TOLERANCE_MM,
): boolean {
  return (
    Math.abs(preview.x - worker.x) <= toleranceMm &&
    Math.abs(preview.y - worker.y) <= toleranceMm &&
    Math.abs(preview.z - worker.z) <= toleranceMm
  );
}
