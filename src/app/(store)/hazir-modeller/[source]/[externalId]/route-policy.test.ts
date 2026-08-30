import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const pagePath = path.join(
  process.cwd(),
  "src/app/(store)/hazir-modeller/[source]/[externalId]/page.tsx",
);

describe("Thingiverse detail route policy", () => {
  const source = readFileSync(pagePath, "utf8");

  it("declares force-dynamic to avoid static-to-dynamic runtime errors", () => {
    expect(source).toContain('export const dynamic = "force-dynamic"');
  });

  it("does not pre-render Thingiverse detail paths via generateStaticParams", () => {
    expect(source).not.toMatch(/export function generateStaticParams/);
  });

  it("does not set segment revalidate that conflicts with runtime fetch", () => {
    expect(source).not.toMatch(/export const revalidate\s*=/);
  });
});
