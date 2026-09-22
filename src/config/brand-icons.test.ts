import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("brand icons", () => {
  it("replaces the Create Next App favicon with a generated ICO", () => {
    const favicon = readFileSync(path.join(process.cwd(), "src/app/favicon.ico"));
    expect(favicon.byteLength).not.toBe(25_931);
    expect(favicon.subarray(0, 4).toString("hex")).toBe("00000100");
  });

  it("ships sized PNG marks", () => {
    for (const size of [16, 32, 48, 180, 192, 512]) {
      const file = readFileSync(path.join(process.cwd(), "public/icons", `icon-${size}.png`));
      expect(file.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
      expect(file.byteLength).toBeGreaterThan(80);
    }
  });
});
