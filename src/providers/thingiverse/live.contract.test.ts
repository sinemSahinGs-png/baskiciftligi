import { describe, expect, it } from "vitest";

describe("optional live Thingiverse contract", () => {
  it.skipIf(process.env.THINGIVERSE_LIVE_TEST !== "1")(
    "calls the official API without printing the token",
    async () => {
      const token = process.env.THINGIVERSE_ACCESS_TOKEN;
      expect(token).toBeTruthy();
      const response = await fetch("https://api.thingiverse.com/popular?page=1", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      expect([200, 401, 403, 429]).toContain(response.status);
      if (response.ok) {
        const payload = (await response.json()) as unknown;
        expect(Array.isArray(payload)).toBe(true);
      }
    },
  );
});
