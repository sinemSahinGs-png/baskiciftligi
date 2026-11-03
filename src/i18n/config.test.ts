import { describe, expect, it } from "vitest";

import { localePath, splitLocalePath } from "@/i18n/config";

describe("locale paths", () => {
  it("splits /en and /ar prefixes", () => {
    expect(splitLocalePath("/en")).toEqual({ locale: "en", pathname: "/" });
    expect(splitLocalePath("/en/magaza")).toEqual({
      locale: "en",
      pathname: "/magaza",
    });
    expect(splitLocalePath("/ar/sepet")).toEqual({
      locale: "ar",
      pathname: "/sepet",
    });
    expect(splitLocalePath("/magaza")).toEqual({
      locale: null,
      pathname: "/magaza",
    });
  });

  it("builds prefixed urls for en/ar and bare urls for tr", () => {
    expect(localePath("en", "/")).toBe("/en");
    expect(localePath("en", "/magaza")).toBe("/en/magaza");
    expect(localePath("en", "/en/magaza")).toBe("/en/magaza");
    expect(localePath("tr", "/en/magaza")).toBe("/magaza");
    expect(localePath("ar", "/en/sepet", "?q=1")).toBe("/ar/sepet?q=1");
  });
});
