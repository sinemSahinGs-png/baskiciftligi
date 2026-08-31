/** Must stay aligned with src/domain/manufacturing/transform-pipeline.ts */

import { placeOnBedTransform, computeOrientedBounds } from "./transform-math.mjs";

export const WORKER_TRANSFORM_ORDER = [
  "scale",
  "rotate_z",
  "rotate_y",
  "rotate_x",
  "center_xy",
  "ensure_on_bed",
];

const DEFAULT_TRANSFORM = {
  version: 1,
  rotationDeg: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1, uniform: true },
  positionMm: { x: 0, y: 0, z: 0 },
  placeOnBed: true,
  source: "manual",
};

function round3(value) {
  return Math.round(value * 1000) / 1000;
}

function roundMm(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function clampScale(value) {
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.min(10, Math.max(0.01, Math.round(value * 10000) / 10000));
}

function normalizeAngleDeg(value) {
  if (!Number.isFinite(value)) return 0;
  let angle = value % 360;
  if (angle > 180) angle -= 360;
  if (angle <= -180) angle += 360;
  return Math.round(angle * 1000) / 1000;
}

export function normalizeTransform(transform) {
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

export function uniformScalePercent(transform) {
  const factor = transform.scale.uniform
    ? transform.scale.x
    : (transform.scale.x + transform.scale.y + transform.scale.z) / 3;
  return Math.round(factor * 100);
}

export function rawDimensionsFromAnalysis(dimensionsMm, scalePercent) {
  const factor = scalePercent / 100;
  if (!(factor > 0)) return dimensionsMm;
  return {
    x: round3(dimensionsMm.x / factor),
    y: round3(dimensionsMm.y / factor),
    z: round3(dimensionsMm.z / factor),
  };
}

export function resolveEffectiveTransform(transform, rawDimensionsMm) {
  const normalized = normalizeTransform(transform);
  if (normalized.placeOnBed) {
    return placeOnBedTransform(normalized, rawDimensionsMm);
  }
  return normalized;
}

export function validateTransformForSlicing(transform) {
  if (!transform) return { ok: true };
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

export function computeExpectedSlicedDimensions(rawDimensionsMm, transform) {
  const effective = resolveEffectiveTransform(transform, rawDimensionsMm);
  return computeOrientedBounds(rawDimensionsMm, effective).dimensions;
}

export function transformToWorkerSliceArgs(
  transform,
  buildVolumeMm,
  rawDimensionsMm,
) {
  const normalized = normalizeTransform(transform ?? DEFAULT_TRANSFORM);
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

export function buildPrusaSliceArgs(input) {
  const {
    transform,
    config,
    profileRoot,
    overridePath,
    inputPath,
    outputPath,
    buildVolumeMm,
    rawDimensionsMm,
    legacyRotateX,
  } = input;

  const validation = validateTransformForSlicing(transform);
  if (!validation.ok) {
    return { ok: false, validation };
  }

  const sliceTransform = transformToWorkerSliceArgs(
    transform,
    buildVolumeMm,
    rawDimensionsMm,
  );

  const rotateX =
    transform?.rotationDeg?.x ??
    (legacyRotateX && !transform ? legacyRotateX : 0);
  const rotateY = sliceTransform.rotateY;
  const rotateZ = sliceTransform.rotateZ;

  const args = [
    "--export-gcode",
    "--output",
    outputPath,
    "--load",
    `${profileRoot}/printer/bambu-a1-dev.ini`,
    "--load",
    `${profileRoot}/filament/pla.ini`,
    "--load",
    `${profileRoot}/print/${config.qualityId}.ini`,
    "--load",
    overridePath,
    "--center",
    `${sliceTransform.centerX},${sliceTransform.centerY}`,
  ];

  if (rotateX) args.push("--rotate-x", String(rotateX));
  if (rotateY) args.push("--rotate-y", String(rotateY));
  if (rotateZ) args.push("--rotate", String(rotateZ));
  if (!sliceTransform.ensureOnBed) {
    args.push("--no-ensure-on-bed");
  } else {
    args.push("--ensure-on-bed");
  }
  args.push(inputPath);

  return {
    ok: true,
    args,
    sliceTransform: {
      ...sliceTransform,
      rotateX,
      rotateY,
      rotateZ,
    },
  };
}
