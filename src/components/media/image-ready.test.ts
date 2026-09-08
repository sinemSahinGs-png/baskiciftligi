import { describe, expect, it } from "vitest";

import { imageIsReady } from "@/components/media/image-ready";

describe("imageIsReady", () => {
  it("accepts a decoded bitmap", () => {
    expect(
      imageIsReady({ complete: true, naturalWidth: 640, naturalHeight: 480 }),
    ).toBe(true);
  });

  it("rejects an unloaded or empty frame", () => {
    expect(
      imageIsReady({ complete: false, naturalWidth: 640, naturalHeight: 480 }),
    ).toBe(false);
    expect(
      imageIsReady({ complete: true, naturalWidth: 0, naturalHeight: 0 }),
    ).toBe(false);
  });
});
