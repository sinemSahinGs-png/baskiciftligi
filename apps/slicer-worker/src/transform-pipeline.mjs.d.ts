/**
 * Type declarations for apps/slicer-worker ESM modules.
 * Keep aligned with transform-pipeline.mjs exports.
 */

export interface WorkerTransform {
  version: 1;
  rotationDeg: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number; uniform: boolean };
  positionMm: { x: number; y: number; z: number };
  placeOnBed: boolean;
  source: string;
}

export interface Vec3Mm {
  x: number;
  y: number;
  z: number;
}

export interface WorkerSliceTransformArgs {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scalePercent: number;
  centerX: number;
  centerY: number;
  ensureOnBed: boolean;
}

export type TransformValidationResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function normalizeTransform(transform: WorkerTransform): WorkerTransform;
export function uniformScalePercent(transform: WorkerTransform): number;
export function rawDimensionsFromAnalysis(
  dimensionsMm: Vec3Mm,
  scalePercent: number,
): Vec3Mm;
export function resolveEffectiveTransform(
  transform: WorkerTransform,
  rawDimensionsMm: Vec3Mm,
): WorkerTransform;
export function validateTransformForSlicing(
  transform: WorkerTransform | null | undefined,
): TransformValidationResult;
export function computeExpectedSlicedDimensions(
  rawDimensionsMm: Vec3Mm,
  transform: WorkerTransform,
): Vec3Mm;
export function transformToWorkerSliceArgs(
  transform: WorkerTransform | null | undefined,
  buildVolumeMm: Vec3Mm,
  rawDimensionsMm: Vec3Mm,
): WorkerSliceTransformArgs;

export const WORKER_TRANSFORM_ORDER: readonly string[];

export function buildPrusaSliceArgs(input: {
  transform: WorkerTransform | null | undefined;
  config: { qualityId: string; scalePercent?: number; infillPercent: number; supports: string };
  profileRoot: string;
  overridePath: string;
  inputPath: string;
  outputPath: string;
  buildVolumeMm: Vec3Mm;
  rawDimensionsMm: Vec3Mm;
  legacyRotateX?: number;
}):
  | { ok: true; args: string[]; sliceTransform: WorkerSliceTransformArgs & { rotateX: number; rotateY: number; rotateZ: number } }
  | { ok: false; validation: TransformValidationResult & { ok: false } };
