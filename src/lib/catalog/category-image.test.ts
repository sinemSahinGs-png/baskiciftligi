import { describe, expect, it } from "vitest";

import {
  categoryImageStyle,
  formatObjectPosition,
  parseObjectPosition,
  resolveCategoryImagePresentation,
} from "./category-image";

describe("category image presentation", () => {
  it("parses and formats object-position percentages", () => {
    expect(parseObjectPosition("20% 80%")).toEqual({ x: 20, y: 80 });
    expect(parseObjectPosition("invalid")).toEqual({ x: 50, y: 50 });
    expect(formatObjectPosition(20, 80)).toBe("20% 80%");
  });

  it("clamps scale and maps contain/cover", () => {
    expect(
      resolveCategoryImagePresentation({
        imageFit: "contain",
        imageScale: 260,
        objectPosition: "10% 90%",
      }),
    ).toEqual({
      fit: "contain",
      scale: 200,
      positionX: 10,
      positionY: 90,
    });
  });

  it("omits transform at 100% scale", () => {
    const style = categoryImageStyle({
      fit: "cover",
      scale: 100,
      positionX: 40,
      positionY: 60,
    });
    expect(style.transform).toBeUndefined();
    expect(style.objectPosition).toBe("40% 60%");
  });
});
