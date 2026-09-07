import { describe, expect, it } from "vitest";

import { heroMedia, pickHeroVideoSrc } from "@/components/home-industrial/hero-media";

describe("pickHeroVideoSrc", () => {
  it("prefers the mobile source on mobile when it exists", () => {
    expect(
      pickHeroVideoSrc({ isMobile: true, mobileOk: true, desktopOk: true }),
    ).toEqual({ src: heroMedia.mobileVideo, kind: "mobile" });
  });

  it("does not load the desktop source on mobile even if desktop exists", () => {
    expect(
      pickHeroVideoSrc({ isMobile: true, mobileOk: false, desktopOk: true }),
    ).toBeNull();
  });

  it("uses desktop on desktop and does not require the mobile file", () => {
    expect(
      pickHeroVideoSrc({ isMobile: false, mobileOk: true, desktopOk: true }),
    ).toEqual({ src: heroMedia.desktopVideo, kind: "desktop" });
  });

  it("returns null when no video is available", () => {
    expect(pickHeroVideoSrc({ isMobile: true, mobileOk: false, desktopOk: false })).toBeNull();
  });
});
