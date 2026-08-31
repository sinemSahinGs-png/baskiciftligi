import type { Vec3Mm } from "@/domain/manufacturing/types";
import type { ManufacturingTransform } from "@/domain/manufacturing/transform";
import { computeOrientedBounds } from "@/domain/manufacturing/transform-math";

export interface BuildVolumeFit {
  fits: boolean;
  outOfBoundsAxes: Array<"x" | "y" | "z">;
  belowPlate: boolean;
  overflowMm: Vec3Mm;
}

export function evaluateBuildVolumeFit(
  originalDimensionsMm: Vec3Mm,
  transform: ManufacturingTransform,
  buildVolumeMm: Vec3Mm,
): BuildVolumeFit {
  const bounds = computeOrientedBounds(originalDimensionsMm, transform);
  const outOfBoundsAxes: Array<"x" | "y" | "z"> = [];
  if (bounds.min.x < 0 || bounds.max.x > buildVolumeMm.x) outOfBoundsAxes.push("x");
  if (bounds.min.y < 0 || bounds.max.y > buildVolumeMm.y) outOfBoundsAxes.push("y");
  if (bounds.max.z > buildVolumeMm.z) outOfBoundsAxes.push("z");
  const belowPlate = bounds.min.z < -0.01;
  return {
    fits: outOfBoundsAxes.length === 0 && !belowPlate,
    outOfBoundsAxes,
    belowPlate,
    overflowMm: {
      x: Math.max(0, bounds.max.x - buildVolumeMm.x, -bounds.min.x),
      y: Math.max(0, bounds.max.y - buildVolumeMm.y, -bounds.min.y),
      z: Math.max(0, bounds.max.z - buildVolumeMm.z),
    },
  };
}
