import { describe, expect, it } from "vitest";

import {
  OCTO_TV_SCREEN_DESKTOP,
  OCTO_TV_SCREEN_MOBILE,
  OCTO_TV_SCREEN_PX,
  OCTO_TV_SOURCE,
  readTvScreenFromStyles,
} from "@/lib/hero-sand/tv-screen";

describe("octo tv screen geometry", () => {
  it("keeps the measured CRT rectangle inside the source photograph", () => {
    expect(OCTO_TV_SCREEN_PX.left).toBeGreaterThan(500);
    expect(OCTO_TV_SCREEN_PX.right).toBeLessThan(OCTO_TV_SOURCE.width - 500);
    expect(OCTO_TV_SCREEN_PX.top).toBeGreaterThan(80);
    expect(OCTO_TV_SCREEN_PX.bottom).toBeLessThan(OCTO_TV_SOURCE.height - 80);
    expect(OCTO_TV_SCREEN_DESKTOP.left + OCTO_TV_SCREEN_DESKTOP.width).toBeLessThan(0.72);
    expect(OCTO_TV_SCREEN_DESKTOP.top + OCTO_TV_SCREEN_DESKTOP.height).toBeLessThan(0.88);
  });

  it("keeps the portrait mobile CRT inside the 1080×1920 still", () => {
    expect(OCTO_TV_SCREEN_MOBILE.width).toBeGreaterThan(0.8);
    expect(OCTO_TV_SCREEN_MOBILE.height).toBeGreaterThan(0.35);
    expect(OCTO_TV_SCREEN_MOBILE.height).toBeLessThan(0.5);
    expect(OCTO_TV_SCREEN_MOBILE.left + OCTO_TV_SCREEN_MOBILE.width).toBeLessThan(0.95);
  });

  it("reads CSS custom properties as unit UV coordinates", () => {
    const screen = readTvScreenFromStyles({
      getPropertyValue: (name: string) => {
        if (name === "--octo-tv-screen-left") return "13.913%";
        if (name === "--octo-tv-screen-top") return "16.3235%";
        if (name === "--octo-tv-screen-width") return "74.0217%";
        if (name === "--octo-tv-screen-height") return "29.8845%";
        if (name === "--octo-tv-screen-radius") return "7%";
        return "";
      },
    } as CSSStyleDeclaration);
    expect(screen.left).toBeCloseTo(0.13913, 5);
    expect(screen.width).toBeCloseTo(0.740217, 5);
  });
});
