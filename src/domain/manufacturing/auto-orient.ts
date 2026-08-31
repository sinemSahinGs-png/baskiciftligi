import type { MeshAnalysis, Vec3Mm } from "@/domain/manufacturing/types";
import { ORIENTATION_CANDIDATES } from "@/domain/manufacturing/types";
import type { ManufacturingTransform } from "@/domain/manufacturing/transform";
import { normalizeTransform } from "@/domain/manufacturing/transform";
import { computeOrientedBounds } from "@/domain/manufacturing/transform-math";

export interface AutoOrientCandidate {
  transform: ManufacturingTransform;
  score: number;
  dimensionsMm: Vec3Mm;
  fits: boolean;
  label: string;
}

function scoreOrientation(
  dimensions: Vec3Mm,
  buildVolume: Vec3Mm,
): { score: number; fits: boolean } {
  const fits =
    dimensions.x <= buildVolume.x &&
    dimensions.y <= buildVolume.y &&
    dimensions.z <= buildVolume.z;
  const bedArea = dimensions.x * dimensions.y;
  const heightPenalty = dimensions.z;
  const score = (fits ? 10_000 : 0) + bedArea / 100 - heightPenalty;
  return { score, fits };
}

export function buildAutoOrientCandidates(
  originalDimensionsMm: Vec3Mm,
  buildVolumeMm: Vec3Mm,
  current: ManufacturingTransform,
): AutoOrientCandidate[] {
  return ORIENTATION_CANDIDATES.map((candidate, index) => {
    const transform = normalizeTransform({
      ...current,
      rotationDeg: {
        x: candidate.rotateX,
        y: candidate.rotateY,
        z: candidate.rotateZ,
      },
      source: "auto_orient",
    });
    const bounds = computeOrientedBounds(originalDimensionsMm, transform);
    const { score, fits } = scoreOrientation(bounds.dimensions, buildVolumeMm);
    return {
      transform,
      score,
      dimensionsMm: bounds.dimensions,
      fits,
      label: `Öneri ${index + 1}`,
    };
  }).sort((left, right) => right.score - left.score);
}

export function nextAutoOrientCandidate(
  candidates: AutoOrientCandidate[],
  appliedIndex: number,
): AutoOrientCandidate | null {
  if (candidates.length === 0) {
    return null;
  }
  const nextIndex = (appliedIndex + 1) % candidates.length;
  return candidates[nextIndex] ?? null;
}

export function autoOrientFromAnalysis(
  analysis: MeshAnalysis,
  buildVolume: Vec3Mm,
  current: ManufacturingTransform,
): AutoOrientCandidate | null {
  const candidates = buildAutoOrientCandidates(
    analysis.dimensionsMm,
    buildVolume,
    current,
  );
  return candidates[0] ?? null;
}

/** Lay-flat heuristic: pick the rotation that minimizes height with largest bed footprint. */
export function quickLayFlatTransform(
  originalDimensionsMm: Vec3Mm,
  current: ManufacturingTransform,
): ManufacturingTransform | null {
  const candidates = ORIENTATION_CANDIDATES.map((candidate) =>
    normalizeTransform({
      ...current,
      rotationDeg: {
        x: candidate.rotateX,
        y: candidate.rotateY,
        z: candidate.rotateZ,
      },
      source: "lay_flat",
    }),
  );
  let best: ManufacturingTransform | null = null;
  let bestScore = -Infinity;
  for (const candidate of candidates) {
    const bounds = computeOrientedBounds(originalDimensionsMm, candidate);
    const score = bounds.dimensions.x * bounds.dimensions.y - bounds.dimensions.z * 10;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}
