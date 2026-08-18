import { describe, expect, it } from "vitest";

import { assertUniqueSlug, slugifyTurkish } from "@/lib/catalog/slug";

describe("Turkish catalog slug generation", () => {
  it("maps Turkish characters to ASCII slugs", () => {
    expect(slugifyTurkish("Çiçekli Işık Şöleni")).toBe("cicekli-isik-soleni");
    expect(slugifyTurkish("ığdır örme ürünü")).toBe("igdir-orme-urunu");
    expect(slugifyTurkish("Güzel  Ürün---Adı")).toBe("guzel-urun-adi");
  });

  it("prevents duplicate slugs for a different product", () => {
    expect(() =>
      assertUniqueSlug("flux-vazo", [{ id: "a", slug: "flux-vazo" }], "b"),
    ).toThrow("Bu slug başka bir üründe kullanılıyor.");

    expect(() =>
      assertUniqueSlug("flux-vazo", [{ id: "a", slug: "flux-vazo" }], "a"),
    ).not.toThrow();
  });
});
