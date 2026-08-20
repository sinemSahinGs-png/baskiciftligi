import { describe, expect, it } from "vitest";

import { normalizeThingList } from "@/providers/thingiverse/normalize-list";

describe("normalizeThingList", () => {
  it("passes through arrays", () => {
    expect(normalizeThingList([{ id: 1, name: "A" }])).toEqual([
      { id: 1, name: "A" },
    ]);
  });

  it("unwraps hits objects from search responses", () => {
    expect(
      normalizeThingList({
        total: 2,
        hits: [
          { id: 10, name: "Vase", license: "Creative Commons - Attribution" },
          {
            id: 11,
            name: "NC vase",
            license: "Creative Commons - Attribution - Non-Commercial",
          },
        ],
      }),
    ).toHaveLength(2);
  });

  it("rejects unknown shapes", () => {
    expect(() => normalizeThingList({ ok: true })).toThrow(/liste biçimi/);
  });
});
