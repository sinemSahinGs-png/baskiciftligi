import { describe, expect, it } from "vitest";

import {
  assertAllowedCatalogUpload,
  assertPngCategoryCover,
  detectCatalogMedia,
} from "@/lib/catalog/file-signature";

const png = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
]);
const jpeg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);

describe("catalog media signatures", () => {
  it("accepts PNG and JPEG signatures", () => {
    expect(detectCatalogMedia(png)?.mimeType).toBe("image/png");
    expect(detectCatalogMedia(jpeg)?.mimeType).toBe("image/jpeg");
  });

  it("rejects SVG and unknown binaries even with a matching filename", () => {
    expect(() =>
      assertAllowedCatalogUpload({
        bytes: Uint8Array.from([0x3c, 0x73, 0x76, 0x67, 0x20, 0x2f, 0x3e, 0, 0, 0, 0, 0]),
        filename: "icon.svg",
        declaredMime: "image/svg+xml",
      }),
    ).toThrow(/SVG/);

    expect(() =>
      assertAllowedCatalogUpload({
        bytes: Uint8Array.from([0x4d, 0x5a, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
        filename: "payload.png",
        declaredMime: "image/png",
      }),
    ).toThrow(/PNG, JPEG/);
  });

  it("accepts only PNG for category covers", () => {
    expect(() =>
      assertPngCategoryCover({
        bytes: jpeg,
        filename: "cover.jpg",
        declaredMime: "image/jpeg",
      }),
    ).toThrow(/yalnızca PNG/);
    expect(assertPngCategoryCover({ bytes: png, filename: "cover.png" }).extension).toBe(
      "png",
    );
  });
});
