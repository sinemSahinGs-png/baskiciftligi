import { describe, expect, it } from "vitest";

import { selectVerifiedAnnouncements } from "@/components/site/announcement-bar";
import type { Announcement } from "@/domain/catalog/types";

const base: Announcement = {
  id: "a1",
  message: "Kargo ürün fiyatına dahil değildir",
  isActive: true,
  position: 1,
};

describe("selectVerifiedAnnouncements", () => {
  it("drops unverified free-shipping promises when no threshold exists", () => {
    const list = selectVerifiedAnnouncements([
      { ...base, id: "free", message: "2.000 TL üzeri ücretsiz kargo", position: 0 },
      base,
      { ...base, id: "off", message: "Mağaza açık", isActive: false, position: 2 },
    ]);
    expect(list.map((item) => item.id)).toEqual(["a1"]);
  });
});
