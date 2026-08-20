import { describe, expect, it } from "vitest";

import { isClaimedQuoteJobRow, sqlUuidOrNull } from "./sql-uuid";

const FILE_ID = "11111111-1111-4111-8111-111111111111";
const JOB_ID = "22222222-2222-4222-8222-222222222222";

describe("sqlUuidOrNull", () => {
  it("treats SQL/JSON null and the string null as absence", () => {
    expect(sqlUuidOrNull(null)).toBeNull();
    expect(sqlUuidOrNull(undefined)).toBeNull();
    expect(sqlUuidOrNull("null")).toBeNull();
    expect(sqlUuidOrNull("NULL")).toBeNull();
    expect(sqlUuidOrNull("  null  ")).toBeNull();
    expect(sqlUuidOrNull("")).toBeNull();
  });

  it("rejects non-uuid strings so they never reach Postgres", () => {
    expect(sqlUuidOrNull("not-a-uuid")).toBeNull();
    expect(sqlUuidOrNull(123)).toBeNull();
  });

  it("accepts a real UUID", () => {
    expect(sqlUuidOrNull(FILE_ID)).toBe(FILE_ID);
  });
});

describe("isClaimedQuoteJobRow", () => {
  it("rejects empty claim composites that PostgREST serializes as null fields", () => {
    expect(
      isClaimedQuoteJobRow({
        id: null,
        file_id: null,
        state: null,
      }),
    ).toBe(false);
    expect(
      isClaimedQuoteJobRow({
        id: "null",
        file_id: "null",
      }),
    ).toBe(false);
    expect(isClaimedQuoteJobRow(null)).toBe(false);
  });

  it("accepts a claimed job with real file and job ids", () => {
    expect(
      isClaimedQuoteJobRow({
        id: JOB_ID,
        file_id: FILE_ID,
        state: "slicing",
      }),
    ).toBe(true);
  });
});
