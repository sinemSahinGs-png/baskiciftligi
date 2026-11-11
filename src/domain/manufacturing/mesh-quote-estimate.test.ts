import { describe, expect, it } from "vitest";

import { estimateSlicingMetricsFromMesh } from "@/domain/manufacturing/mesh-quote-estimate";
import type { MeshAnalysis, PrintConfiguration } from "@/domain/manufacturing/types";

const analysis: MeshAnalysis = {
  format: "stl",
  triangleCount: 100,
  vertexCount: 50,
  shellCount: 1,
  boundingBoxMm: { min: { x: 0, y: 0, z: 0 }, max: { x: 40, y: 30, z: 20 } },
  dimensionsMm: { x: 40, y: 30, z: 20 },
  volumeMm3: 12_000,
  manifold: true,
  watertight: true,
  degenerateFaces: 0,
  hasInvalidCoordinates: false,
  fitsBuildVolume: true,
  scalePercent: 100,
  checksumSha256: "abc",
  unitAssumed: "mm",
  flags: [],
};

const configuration: PrintConfiguration = {
  printerProfileId: "printer-bambu-a1-dev",
  printerProfileVersion: 1,
  materialId: "pla",
  colorId: "black",
  qualityId: "standart",
  infillPercent: 20,
  supports: "auto",
  scalePercent: 100,
  quantity: 1,
  unit: "mm",
  customScale: null,
};

describe("estimateSlicingMetricsFromMesh", () => {
  it("returns positive grams and duration from mesh volume", () => {
    const metrics = estimateSlicingMetricsFromMesh(analysis, configuration);
    expect(metrics.filamentWeightGrams).toBeGreaterThan(2);
    expect(metrics.estimatedDurationSeconds).toBeGreaterThanOrEqual(300);
    expect(metrics.engine.name).toBe("bc-mesh-estimate");
  });

  it("increases mass when infill and supports rise", () => {
    const light = estimateSlicingMetricsFromMesh(analysis, {
      ...configuration,
      infillPercent: 10,
      supports: "off",
    });
    const heavy = estimateSlicingMetricsFromMesh(analysis, {
      ...configuration,
      infillPercent: 40,
      supports: "on",
    });
    expect(heavy.filamentWeightGrams).toBeGreaterThan(light.filamentWeightGrams);
  });
});
