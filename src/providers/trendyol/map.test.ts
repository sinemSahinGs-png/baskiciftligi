import { describe, expect, it } from "vitest";

import { mapTrendyolProduct, trendyolImageUrl, tryToMinor } from "@/providers/trendyol/map";

describe("trendyol mapper", () => {
  it("converts lira prices to kuruş", () => {
    expect(tryToMinor(199.9)).toBe(19990);
    expect(tryToMinor("12")).toBe(1200);
  });

  it("prefixes relative CDN paths", () => {
    expect(trendyolImageUrl("/prod/a.jpg")).toBe("https://cdn.dsmcdn.com/prod/a.jpg");
    expect(trendyolImageUrl("https://cdn.dsmcdn.com/x.webp")).toBe(
      "https://cdn.dsmcdn.com/x.webp",
    );
  });

  it("maps an approved v2 product with variants and sale price", () => {
    const mapped = mapTrendyolProduct({
      contentId: 11,
      title: "Octo Vazo",
      description: "<p>El yapımı 3D baskı vazo.</p>",
      images: [{ url: "/prod/vazo.jpg" }],
      variants: [
        {
          barcode: "869000000001",
          stockCode: "OCTO-VAZO",
          onSale: true,
          price: { salePrice: 250, listPrice: 300 },
          stock: { quantity: 4 },
          attributes: [{ attributeName: "Renk", attributeValue: "Kum" }],
        },
      ],
    });
    expect(mapped?.sku).toBe("OCTO-VAZO");
    expect(mapped?.priceMinor).toBe(25000);
    expect(mapped?.compareAtPriceMinor).toBe(30000);
    expect(mapped?.status).toBe("active");
    expect(mapped?.media[0]?.url).toContain("cdn.dsmcdn.com");
    expect(mapped?.variants[0]?.inventoryQuantity).toBe(4);
  });

  it("skips archived or nameless rows", () => {
    expect(mapTrendyolProduct({ title: "X", archived: true })).toBeNull();
    expect(mapTrendyolProduct({ title: "" })).toBeNull();
  });
});
