import { describe, expect, it } from "vitest";

import { mapThingiverseCategory } from "@/providers/thingiverse/categories";
import {
  canAutomaticallyQuoteLicense,
  normalizeLicense,
} from "@/domain/manufacturing/licenses";

describe("thingiverse category mapping", () => {
  it("maps gadgets / phone stand to Masaüstü Aksesuarları", () => {
    expect(
      mapThingiverseCategory({
        name: "Phone stand",
        tags: ["gadgets", "desk"],
      }),
    ).toBe("Masaüstü Aksesuarları");
  });

  it("maps sculptures to Biblo ve Heykel", () => {
    expect(
      mapThingiverseCategory({ name: "Dragon bust", tags: ["art", "sculptures"] }),
    ).toBe("Biblo ve Heykel");
  });

  it("maps keychains", () => {
    expect(mapThingiverseCategory({ name: "Logo keychain", tags: ["keychains"] })).toBe(
      "Anahtarlık",
    );
  });
});

describe("thingiverse license pricing gate", () => {
  it("allows CC0 and CC BY", () => {
    expect(canAutomaticallyQuoteLicense(normalizeLicense("CC0"))).toBe(true);
    expect(
      canAutomaticallyQuoteLicense(normalizeLicense("Creative Commons - Attribution")),
    ).toBe(true);
  });

  it("blocks NC, ND, SA, unknown", () => {
    expect(
      canAutomaticallyQuoteLicense(
        normalizeLicense("Creative Commons - Attribution - Non-Commercial"),
      ),
    ).toBe(false);
    expect(
      canAutomaticallyQuoteLicense(
        normalizeLicense("Creative Commons - Attribution - No Derivatives"),
      ),
    ).toBe(false);
    expect(
      canAutomaticallyQuoteLicense(
        normalizeLicense("Creative Commons - Attribution - Share Alike"),
      ),
    ).toBe(false);
    expect(canAutomaticallyQuoteLicense(normalizeLicense("Proprietary"))).toBe(
      false,
    );
  });
});
