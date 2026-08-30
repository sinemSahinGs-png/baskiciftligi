import type { Vec3Mm } from "@/domain/manufacturing/types";
import type { ManufacturingTransform } from "@/domain/manufacturing/transform";
import { normalizeAngleDeg, normalizeTransform } from "@/domain/manufacturing/transform";

export interface OrientedBounds {
  min: Vec3Mm;
  max: Vec3Mm;
  dimensions: Vec3Mm;
}

function degToRad(value: number) {
  return (value * Math.PI) / 180;
}

function rotatePoint(
  point: Vec3Mm,
  rotationDeg: { x: number; y: number; z: number },
): Vec3Mm {
  let { x, y, z } = point;
  const rx = degToRad(rotationDeg.x);
  const ry = degToRad(rotationDeg.y);
  const rz = degToRad(rotationDeg.z);

  // Z (roll)
  {
    const x1 = x * Math.cos(rz) - y * Math.sin(rz);
    const y1 = x * Math.sin(rz) + y * Math.cos(rz);
    x = x1;
    y = y1;
  }
  // Y (yaw)
  {
    const x1 = x * Math.cos(ry) + z * Math.sin(ry);
    const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
    x = x1;
    z = z1;
  }
  // X (pitch)
  {
    const y1 = y * Math.cos(rx) - z * Math.sin(rx);
    const z1 = y * Math.sin(rx) + z * Math.cos(rx);
    y = y1;
    z = z1;
  }
  return { x, y, z };
}

function cornersFromDimensions(dimensions: Vec3Mm): Vec3Mm[] {
  const { x, y, z } = dimensions;
  return [
    { x: 0, y: 0, z: 0 },
    { x, y: 0, z: 0 },
    { x: 0, y, z: 0 },
    { x: 0, y: 0, z },
    { x, y, z: 0 },
    { x, y: 0, z },
    { x: 0, y, z },
    { x, y, z },
  ];
}

export function computeOrientedBounds(
  originalDimensionsMm: Vec3Mm,
  transform: ManufacturingTransform,
): OrientedBounds {
  const normalized = normalizeTransform(transform);
  const scaledCorners = cornersFromDimensions({
    x: originalDimensionsMm.x * normalized.scale.x,
    y: originalDimensionsMm.y * normalized.scale.y,
    z: originalDimensionsMm.z * normalized.scale.z,
  }).map((point) => rotatePoint(point, normalized.rotationDeg));

  const xs = scaledCorners.map((point) => point.x + normalized.positionMm.x);
  const ys = scaledCorners.map((point) => point.y + normalized.positionMm.y);
  const zs = scaledCorners.map((point) => point.z + normalized.positionMm.z);

  const min = {
    x: Math.min(...xs),
    y: Math.min(...ys),
    z: Math.min(...zs),
  };
  const max = {
    x: Math.max(...xs),
    y: Math.max(...ys),
    z: Math.max(...zs),
  };

  return {
    min,
    max,
    dimensions: {
      x: max.x - min.x,
      y: max.y - min.y,
      z: max.z - min.z,
    },
  };
}

export function placeOnBedTransform(
  transform: ManufacturingTransform,
  originalDimensionsMm: Vec3Mm,
): ManufacturingTransform {
  const bounds = computeOrientedBounds(originalDimensionsMm, transform);
  const deltaZ = transform.placeOnBed ? -bounds.min.z : 0;
  return normalizeTransform({
    ...transform,
    positionMm: {
      x: transform.positionMm.x,
      y: transform.positionMm.y,
      z: transform.positionMm.z + deltaZ,
    },
    source: transform.source,
  });
}

export function centerOnPlateTransform(
  transform: ManufacturingTransform,
  originalDimensionsMm: Vec3Mm,
  buildVolumeMm: Vec3Mm,
): ManufacturingTransform {
  const placed = placeOnBedTransform(transform, originalDimensionsMm);
  const bounds = computeOrientedBounds(originalDimensionsMm, placed);
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  const centerY = (bounds.min.y + bounds.max.y) / 2;
  const bedCenterX = buildVolumeMm.x / 2;
  const bedCenterY = buildVolumeMm.y / 2;
  return normalizeTransform({
    ...placed,
    positionMm: {
      x: placed.positionMm.x + (bedCenterX - centerX),
      y: placed.positionMm.y + (bedCenterY - centerY),
      z: placed.positionMm.z,
    },
    source: "manual",
  });
}

export function fitUniformScaleToVolume(
  originalDimensionsMm: Vec3Mm,
  transform: ManufacturingTransform,
  buildVolumeMm: Vec3Mm,
  marginMm = 2,
): ManufacturingTransform {
  const bounds = computeOrientedBounds(originalDimensionsMm, {
    ...transform,
    scale: { x: 1, y: 1, z: 1, uniform: true },
  });
  const maxDim = Math.max(bounds.dimensions.x, bounds.dimensions.y, bounds.dimensions.z);
  const allowed = Math.min(buildVolumeMm.x, buildVolumeMm.y, buildVolumeMm.z) - marginMm;
  if (maxDim <= 0 || allowed <= 0) {
    return transform;
  }
  const factor = Math.min(1, allowed / maxDim);
  return normalizeTransform({
    ...transform,
    scale: {
      x: factor,
      y: factor,
      z: factor,
      uniform: true,
    },
    source: "fit_volume",
  });
}

export function applyRotationDelta(
  transform: ManufacturingTransform,
  axis: "x" | "y" | "z",
  deltaDeg: number,
): ManufacturingTransform {
  return normalizeTransform({
    ...transform,
    rotationDeg: {
      ...transform.rotationDeg,
      [axis]: normalizeAngleDeg(transform.rotationDeg[axis] + deltaDeg),
    },
    source: "manual",
  });
}

export function applyUniformScaleFromPercent(
  transform: ManufacturingTransform,
  percent: number,
): ManufacturingTransform {
  const factor = Math.max(0.01, Math.min(10, percent / 100));
  return normalizeTransform({
    ...transform,
    scale: { x: factor, y: factor, z: factor, uniform: true },
    source: "manual",
  });
}

export function applyDimensionMm(
  transform: ManufacturingTransform,
  originalDimensionsMm: Vec3Mm,
  axis: "x" | "y" | "z",
  targetMm: number,
  lockAspect: boolean,
): ManufacturingTransform {
  if (!Number.isFinite(targetMm) || targetMm <= 0) {
    return transform;
  }
  const current = computeOrientedBounds(originalDimensionsMm, transform).dimensions;
  const currentAxis = current[axis];
  if (currentAxis <= 0) {
    return transform;
  }
  const factor = targetMm / currentAxis;
  if (lockAspect) {
    const base = transform.scale.uniform ? transform.scale.x : 1;
    const next = base * factor;
    return normalizeTransform({
      ...transform,
      scale: { x: next, y: next, z: next, uniform: true },
      source: "manual",
    });
  }
  const nextScale = { ...transform.scale, uniform: false };
  nextScale[axis] = clampScaleAxis(transform.scale[axis] * factor);
  return normalizeTransform({
    ...transform,
    scale: nextScale,
    source: "manual",
  });
}

function clampScaleAxis(value: number) {
  return Math.max(0.01, Math.min(10, value));
}

export function snapAngle(value: number, snapDeg: number | null): number {
  if (!snapDeg || snapDeg <= 0) {
    return normalizeAngleDeg(value);
  }
  return normalizeAngleDeg(Math.round(value / snapDeg) * snapDeg);
}
