import type { Vec3Mm } from "@/domain/manufacturing/types";

export class ThreeMfError extends Error {
  constructor(
    readonly code:
      | "empty_mesh"
      | "corrupt"
      | "archive"
      | "security"
      | "multi_plate"
      | "xxe"
      | "cycle"
      | "unsupported",
    message: string,
  ) {
    super(message);
    this.name = "ThreeMfError";
  }
}

export interface ThreeMfPlate {
  id: string;
  label: string;
  objectIds: number[] | null;
  triangleCount: number;
  vertexCount: number;
  dimensionsMm: Vec3Mm;
  boundingBoxMm: { min: Vec3Mm; max: Vec3Mm };
  positions: Float32Array;
  colors: Float32Array | null;
}

export interface ParsedThreeMf {
  unit: string;
  unitScaleToMm: number;
  rootModelPath: string;
  plates: ThreeMfPlate[];
  requiresPlateSelection: boolean;
  objectCount: number;
}

export const THREEMF_MAX_COMPONENT_DEPTH = 12;
export const THREEMF_MAX_OBJECTS = 256;
export const THREEMF_MAX_MESHES = 256;

/** Only model/relationship/plate metadata is parsed. G-code and previews are ignored. */
export function isThreeMfReadEntry(name: string) {
  const normalized = name.replace(/\\/g, "/").replace(/^\/+/, "").toLowerCase();
  if (
    normalized.endsWith(".gcode") ||
    normalized.endsWith(".gco") ||
    normalized.includes(".gcode.") ||
    /\.(png|jpg|jpeg|webp|bmp|gif|md5|mp4)$/.test(normalized)
  ) {
    return false;
  }
  return (
    normalized.endsWith(".model") ||
    normalized.endsWith(".rels") ||
    normalized === "[content_types].xml" ||
    /metadata\/plate_\d+\.json$/.test(normalized)
  );
}
