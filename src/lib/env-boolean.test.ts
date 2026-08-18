import { describe, expect, it } from "vitest";

import { parseStrictEnvBoolean } from "@/lib/env-boolean";

describe("parseStrictEnvBoolean", () => {
  it("enables only the normalized literal true", () => {
    expect(parseStrictEnvBoolean("true")).toBe(true);
    expect(parseStrictEnvBoolean("TRUE")).toBe(true);
    expect(parseStrictEnvBoolean(" true ")).toBe(true);
  });

  it("does not treat presence, zero, or false as enabled", () => {
    expect(parseStrictEnvBoolean("false")).toBe(false);
    expect(parseStrictEnvBoolean("0")).toBe(false);
    expect(parseStrictEnvBoolean("1")).toBe(false);
    expect(parseStrictEnvBoolean("yes")).toBe(false);
    expect(parseStrictEnvBoolean("on")).toBe(false);
    expect(parseStrictEnvBoolean("")).toBe(false);
    expect(parseStrictEnvBoolean("   ")).toBe(false);
    expect(parseStrictEnvBoolean(undefined)).toBe(false);
    expect(parseStrictEnvBoolean(null)).toBe(false);
  });
});
