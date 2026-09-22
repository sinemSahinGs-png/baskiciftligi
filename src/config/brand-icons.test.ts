import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("brand icons", () => {
  it("replaces the Create Next App favicon with a generated ICO", () => {
    const favicon = readFileSync(path.join(process.cwd(), "src/app/favicon.ico"));
    expect(favicon.byteLength).not.toBe(25_931);
    expect(favicon.subarray(0, 4).toString("hex")).toBe("00000100");
  });
});
