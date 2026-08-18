import { describe, expect, it } from "vitest";

import {
  isPubliclyVisibleProduct,
  isScheduledProduct,
} from "@/lib/catalog/visibility";

const now = Date.parse("2026-08-18T08:00:00.000Z");

describe("publication visibility", () => {
  it("shows only published products whose publication time has passed", () => {
    expect(
      isPubliclyVisibleProduct(
        { status: "active", publishedAt: "2026-08-18T07:00:00.000Z" },
        now,
      ),
    ).toBe(true);
    expect(
      isPubliclyVisibleProduct(
        { status: "active", publishedAt: "2026-08-18T09:00:00.000Z" },
        now,
      ),
    ).toBe(false);
    expect(
      isPubliclyVisibleProduct({ status: "draft", publishedAt: "2026-08-01T00:00:00.000Z" }, now),
    ).toBe(false);
    expect(
      isPubliclyVisibleProduct(
        { status: "archived", publishedAt: "2026-08-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(false);
    expect(
      isPubliclyVisibleProduct(
        { status: "scheduled", publishedAt: "2026-08-18T07:00:00.000Z" },
        now,
      ),
    ).toBe(true);
    expect(
      isPubliclyVisibleProduct(
        { status: "scheduled", publishedAt: "2026-08-18T09:00:00.000Z" },
        now,
      ),
    ).toBe(false);
  });

  it("treats future drafts as scheduled", () => {
    expect(
      isScheduledProduct(
        { status: "draft", publishedAt: "2026-08-19T00:00:00.000Z" },
        now,
      ),
    ).toBe(true);
    expect(
      isScheduledProduct({ status: "scheduled", publishedAt: "2026-08-19T00:00:00.000Z" }, now),
    ).toBe(true);
  });
});
