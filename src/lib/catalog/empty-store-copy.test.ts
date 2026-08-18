import { describe, expect, it } from "vitest";

import { STORE_EMPTY_COPY } from "@/lib/catalog/empty-store-copy";
import { customerCopyLeaksConfiguration } from "@/lib/launch/sanitize";

describe("production empty catalog copy", () => {
  it("uses the Baskı Çiftliği opening state without technical leaks", () => {
    expect(STORE_EMPTY_COPY.title).toBe("Yeni ürünler hazırlanıyor.");
    expect(STORE_EMPTY_COPY.actions.map((action) => action.label)).toEqual([
      "Model yükle",
      "Hazır modelleri incele",
      "Kurumsal teklif al",
    ]);
    expect(
      customerCopyLeaksConfiguration(
        `${STORE_EMPTY_COPY.title} ${STORE_EMPTY_COPY.description}`,
      ),
    ).toBe(false);
  });
});
