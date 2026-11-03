import { describe, expect, it } from "vitest";

import {
  allowHeroDebug,
  chooseSandDpr,
  chooseSandGrid,
  isHeroChrome,
  sandImpulseFromPointer,
} from "@/lib/hero-sand/physics";

describe("octo sand physics helpers", () => {
  it("keeps HTML content usable by selecting no grid without WebGL or with reduced motion", () => {
    expect(
      chooseSandGrid({ width: 1440, reducedMotion: false, saveData: false, webgl2: false }),
    ).toBe(0);
    expect(
      chooseSandGrid({ width: 1440, reducedMotion: true, saveData: false, webgl2: true }),
    ).toBe(0);
    expect(
      chooseSandGrid({ width: 390, reducedMotion: false, saveData: false, webgl2: true }),
    ).toBe(256);
    expect(
      chooseSandGrid({ width: 768, reducedMotion: false, saveData: false, webgl2: true }),
    ).toBe(384);
    expect(
      chooseSandGrid({ width: 1440, reducedMotion: false, saveData: false, webgl2: true }),
    ).toBe(512);
  });

  it("caps device pixel ratio", () => {
    expect(chooseSandDpr(3, 390)).toBe(1.5);
    expect(chooseSandDpr(3, 1440)).toBe(2);
  });

  it("does not excavate when the pointer is still", () => {
    expect(sandImpulseFromPointer({ dx: 0, dy: 0, isTouch: false }).force).toBe(0);
  });

  it("lets vertical touch movement count as scroll instead of a brush", () => {
    const result = sandImpulseFromPointer({ dx: 2, dy: 28, isTouch: true });
    expect(result.scrolling).toBe(true);
    expect(result.force).toBe(0);
  });

  it("treats links and inputs as chrome that must not drive sand", () => {
    const link = document.createElement("a");
    link.href = "/magaza";
    document.body.append(link);
    expect(isHeroChrome(link)).toBe(true);
    expect(isHeroChrome(document.body)).toBe(false);
    link.remove();
  });

  it("keeps production host free of the debug overlay by default", () => {
    expect(allowHeroDebug("baskiciftligi.com", "?heroDebug=1")).toBe(false);
    expect(allowHeroDebug("localhost", "?heroDebug=1")).toBe(true);
    expect(allowHeroDebug("localhost", "")).toBe(false);
  });
});
