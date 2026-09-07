import { describe, expect, it } from "vitest";

import { catalogCardImageUrl } from "@/lib/catalog/media-url";

describe("catalogCardImageUrl", () => {
  it("requests a bounded render URL for public catalog-media objects", () => {
    expect(
      catalogCardImageUrl(
        "https://example.supabase.co/storage/v1/object/public/catalog-media/products/a.png",
        640,
      ),
    ).toBe(
      "https://example.supabase.co/storage/v1/render/image/public/catalog-media/products/a.png?width=640&resize=contain&quality=70",
    );
  });

  it("leaves non-supabase sources unchanged", () => {
    expect(catalogCardImageUrl("/demo/product.png", 640)).toBe("/demo/product.png");
  });
});
