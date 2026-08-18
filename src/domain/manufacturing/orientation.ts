import type { MeshAnalysis, Vec3Mm } from "@/domain/manufacturing/types";
import { ORIENTATION_CANDIDATES } from "@/domain/manufacturing/types";

export interface OrientationCandidate {
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  height: number;
  bedArea: number;
  fits: boolean;
  score: number;
}

function rotatePoint(point: Vec3Mm, rotateX: number, rotateY: number): Vec3Mm {
  const rx = (rotateX * Math.PI) / 180;
  const ry = (rotateY * Math.PI) / 180;
  let { x, y, z } = point;
  const y1 = y * Math.cos(rx) - z * Math.sin(rx);
  const z1 = y * Math.sin(rx) + z * Math.cos(rx);
  y = y1;
  z = z1;
  const x2 = x * Math.cos(ry) + z * Math.sin(ry);
  const z2 = -x * Math.sin(ry) + z * Math.cos(ry);
  x = x2;
  z = z2;
  return { x, y, z };
}

function rotatedDimensions(dimensions: Vec3Mm, rotateX: number, rotateY: number): Vec3Mm {
  const corners = [
    { x: 0, y: 0, z: 0 },
    { x: dimensions.x, y: 0, z: 0 },
    { x: 0, y: dimensions.y, z: 0 },
    { x: 0, y: 0, z: dimensions.z },
    { x: dimensions.x, y: dimensions.y, z: 0 },
    { x: dimensions.x, y: 0, z: dimensions.z },
    { x: 0, y: dimensions.y, z: dimensions.z },
    { x: dimensions.x, y: dimensions.y, z: dimensions.z },
  ].map((point) => rotatePoint(point, rotateX, rotateY));
  const xs = corners.map((point) => point.x);
  const ys = corners.map((point) => point.y);
  const zs = corners.map((point) => point.z);
  return {
    x: Math.max(...xs) - Math.min(...xs),
    y: Math.max(...ys) - Math.min(...ys),
    z: Math.max(...zs) - Math.min(...zs),
  };
}

export function chooseOrientation(
  analysis: MeshAnalysis,
  buildVolume: Vec3Mm,
): { selected: OrientationCandidate; ambiguous: boolean; candidates: OrientationCandidate[] } {
  const candidates = ORIENTATION_CANDIDATES.map((item) => {
    const size = rotatedDimensions(analysis.dimensionsMm, item.rotateX, item.rotateY);
    const fits =
      size.x <= buildVolume.x && size.y <= buildVolume.y && size.z <= buildVolume.z;
    const bedArea = size.x * size.y;
    const score = (fits ? 10_000 : 0) + bedArea / 100 - size.z;
    return {
      ...item,
      height: size.z,
      bedArea,
      fits,
      score,
    };
  }).sort((left, right) => right.score - left.score);

  const selected = candidates[0]!;
  const runnerUp = candidates[1];
  const ambiguous = Boolean(
    runnerUp && Math.abs(selected.score - runnerUp.score) < 2 && selected.fits && runnerUp.fits,
  );
  return { selected, ambiguous, candidates };
}
