import { describe, expect, it } from "vitest";

import { normalizeSupabaseProjectUrl } from "@/lib/supabase/url";

describe("normalizeSupabaseProjectUrl", () => {
  it("strips rest/v1 suffixes from project URLs", () => {
    expect(
      normalizeSupabaseProjectUrl("https://abc.supabase.co/rest/v1/"),
    ).toBe("https://abc.supabase.co");
    expect(
      normalizeSupabaseProjectUrl("https://abc.supabase.co/rest/v1"),
    ).toBe("https://abc.supabase.co");
  });

  it("leaves clean project roots unchanged", () => {
    expect(normalizeSupabaseProjectUrl("https://abc.supabase.co")).toBe(
      "https://abc.supabase.co",
    );
  });
});
