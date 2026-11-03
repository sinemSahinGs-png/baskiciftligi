import { QUALITY_PROFILES } from "@/domain/manufacturing/profiles";
import type {
  MeshAnalysis,
  PrintConfiguration,
  SlicingMetrics,
} from "@/domain/manufacturing/types";

const PLA_DENSITY_G_PER_CM3 = 1.24;
const FILAMENT_DIAMETER_MM = 1.75;
const EXTRUSION_MM3_PER_S = 8;
const WALL_FRACTION = 0.12;

export function estimateSlicingMetricsFromMesh(
  analysis: MeshAnalysis,
  configuration: PrintConfiguration,
): SlicingMetrics {
  const bboxVolume =
    Math.max(0, analysis.dimensionsMm.x) *
    Math.max(0, analysis.dimensionsMm.y) *
    Math.max(0, analysis.dimensionsMm.z);
  const volumeMm3 = Math.max(1, analysis.volumeMm3 ?? bboxVolume * 0.35);
  const infill = Math.min(1, Math.max(0.05, configuration.infillPercent / 100));
  const supportMul = configuration.supports === "off" ? 1 : 1.12;
  const solidFraction = Math.min(0.92, WALL_FRACTION + infill * 0.55);
  const printVolumeMm3 = volumeMm3 * solidFraction * supportMul;
  const grams = Math.max(2, (printVolumeMm3 / 1000) * PLA_DENSITY_G_PER_CM3);
  const quality = QUALITY_PROFILES.find((item) => item.id === configuration.qualityId);
  const layerHeightMm = quality?.layerHeightMm ?? 0.2;
  const durationSeconds = Math.max(
    300,
    Math.round(printVolumeMm3 / EXTRUSION_MM3_PER_S / (0.2 / layerHeightMm)),
  );
  const radiusMm = FILAMENT_DIAMETER_MM / 2;
  const filamentAreaMm2 = Math.PI * radiusMm * radiusMm;
  const filamentLengthMm = (grams / PLA_DENSITY_G_PER_CM3) * 1000 / filamentAreaMm2;

  return {
    dimensionsMm: analysis.dimensionsMm,
    filamentLengthMm: Math.round(filamentLengthMm),
    filamentWeightGrams: Math.round(grams * 100) / 100,
    estimatedDurationSeconds: durationSeconds,
    layerCount: Math.max(1, Math.round(analysis.dimensionsMm.z / layerHeightMm)),
    supportUsed: configuration.supports !== "off",
    materialId: configuration.materialId,
    qualityId: configuration.qualityId,
    quantity: configuration.quantity,
    orientation: { rotateX: 0, rotateY: 0, rotateZ: 0 },
    engine: { name: "bc-mesh-estimate", version: "1" },
    profileChecksum: "mesh-estimate-v1",
    warnings: ["Hacim tahmini; dilimleyici yoksa anında fiyat için kullanılır."],
  };
}
