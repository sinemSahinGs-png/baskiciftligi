import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import { createBinaryStlCube } from "./mesh";

function dockerEngineReachable(): boolean {
  try {
    execFileSync("docker", ["info"], {
      timeout: 8_000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

const dockerUp = dockerEngineReachable();

describe("slicer integration gate", () => {
  it("keeps the 20 mm cube fixture parseable", () => {
    const bytes = createBinaryStlCube(20);
    expect(bytes.byteLength).toBe(84 + 12 * 50);
  });

  it.skipIf(!dockerUp)(
    "requires a healthy slicer-worker when the Docker engine is reachable",
    async () => {
      const health = await fetch("http://127.0.0.1:8788/health");
      expect(
        health.ok,
        "Docker is reachable so slicer-worker must be up; run npm run manufacturing:up",
      ).toBe(true);
      const payload = (await health.json()) as { prusaSlicerPinned?: string; ok?: boolean };
      expect(payload.ok).toBe(true);
      expect(payload.prusaSlicerPinned).toBe("2.8.1");
    },
  );
});
