import { describe, expect, it, vi } from "vitest";

import { applyExternalProductionOptions } from "@/lib/models/apply-production-options";

describe("applyExternalProductionOptions", () => {
  it("maps production options into configurator state setters", () => {
    const material = vi.fn();
    const colorId = vi.fn();
    const scalePercent = vi.fn();
    const quantity = vi.fn();

    applyExternalProductionOptions({
      material,
      colorId,
      scalePercent,
      quantity,
      options: {
        material: "pla",
        color: "beyaz",
        sizePreset: "orta",
        quantity: 3,
      },
    });

    expect(material).toHaveBeenCalledWith("PLA");
    expect(colorId).toHaveBeenCalledWith("white");
    expect(scalePercent).toHaveBeenCalledWith(100);
    expect(quantity).toHaveBeenCalledWith(3);
  });
});
