import { describe, expect, it } from "vitest";

import {
  classifySiteUrl,
  isEnvNamePublic,
  mandatoryProductionEnv,
  optionalIntegrationEnv,
  PRODUCTION_SITE_URL,
} from "@/lib/deployment-readiness";

describe("deployment readiness", () => {
  it("treats the apex domain as the only canonical production URL", () => {
    expect(PRODUCTION_SITE_URL).toBe("https://baskiciftligi.com");
    expect(classifySiteUrl("https://baskiciftligi.com")).toBe("canonical");
    expect(classifySiteUrl("http://localhost:3000")).toBe("development");
    expect(classifySiteUrl(undefined)).toBe("missing");
  });

  it("keeps server secrets off NEXT_PUBLIC_", () => {
    for (const name of optionalIntegrationEnv) {
      if (
        name === "NEXT_PUBLIC_SUPABASE_URL" ||
        name === "NEXT_PUBLIC_SUPABASE_ANON_KEY"
      ) {
        expect(isEnvNamePublic(name)).toBe(true);
        continue;
      }
      expect(isEnvNamePublic(name)).toBe(false);
    }
    expect(mandatoryProductionEnv.every((name) => isEnvNamePublic(name))).toBe(
      true,
    );
  });
});
