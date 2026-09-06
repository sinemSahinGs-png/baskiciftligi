import { describe, expect, it } from "vitest";

import {
  analyticsContainsRawQuery,
  sanitizeHomeAnalytics,
  type HomeAnalyticsPayload,
} from "@/lib/home/analytics";

describe("home analytics", () => {
  it("keeps anonymous fields only", () => {
    const payload = sanitizeHomeAnalytics({
      name: "idea_search_succeeded",
      category: "masaüstü",
      resultCount: 6,
      status: "ok",
    });
    expect(payload).toEqual({
      name: "idea_search_succeeded",
      category: "masaüstü",
      resultCount: 6,
      status: "ok",
    });
    expect("query" in payload).toBe(false);
  });

  it("does not embed the raw user sentence", () => {
    const raw = "Ejderha şeklinde telefon standı istiyorum";
    const payload: HomeAnalyticsPayload = {
      name: "idea_search_started",
      category: "masaüstü",
    };
    expect(analyticsContainsRawQuery(payload, raw)).toBe(false);
    expect(analyticsContainsRawQuery(sanitizeHomeAnalytics(payload), raw)).toBe(
      false,
    );
  });
});
