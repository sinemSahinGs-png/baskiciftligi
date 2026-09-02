/** @vitest-environment node */

import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationDir = path.join(process.cwd(), "supabase", "migrations");
const hotfixFile = "20260902120000_owner_shipping_policy_v2.sql";
const creatorFile = "20260820060000_production_persistence.sql";

function readMigration(name: string) {
  return readFileSync(path.join(migrationDir, name), "utf8");
}

describe("commerce_shipping_policies migrations", () => {
  it("is created by 20260820060000_production_persistence.sql", () => {
    const sql = readMigration(creatorFile);
    expect(sql).toMatch(
      /create table if not exists public\.commerce_shipping_policies/i,
    );
    expect(sql).toMatch(/standard_shipping_minor bigint not null/i);
    expect(sql).toMatch(/free_shipping_threshold_minor bigint not null/i);
  });

  it("lists the creator migration before the v2 seed in lexicographic order", () => {
    const files = readdirSync(migrationDir).filter((name) => name.endsWith(".sql")).sort();
    expect(files.indexOf(creatorFile)).toBeGreaterThan(-1);
    expect(files.indexOf(hotfixFile)).toBeGreaterThan(files.indexOf(creatorFile));
  });

  it("hotfix creates the table if missing and seeds version 2 idempotently", () => {
    const sql = readMigration(hotfixFile);
    expect(sql).toMatch(
      /create table if not exists public\.commerce_shipping_policies/i,
    );
    expect(sql).toMatch(/version integer primary key/i);
    expect(sql).toMatch(/currency text not null/i);
    expect(sql).toMatch(/standard_shipping_minor bigint not null/i);
    expect(sql).toMatch(/free_shipping_threshold_minor bigint not null/i);
    expect(sql).toMatch(/activated_at timestamptz/i);
    expect(sql).toMatch(/\bnotes text\b/i);
    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/create policy shipping_policies_public_read/i);
    expect(sql).toMatch(/create policy shipping_policies_service/i);
    expect(sql).toMatch(
      /grant select on table public\.commerce_shipping_policies to anon, authenticated/i,
    );
    expect(sql).toMatch(
      /grant all privileges on table public\.commerce_shipping_policies to service_role/i,
    );
    expect(sql).toMatch(/values \(\s*2,/i);
    expect(sql).toMatch(/10000/);
    expect(sql).toMatch(/free_shipping_threshold_minor,\s*[\s\S]*0,/);
    expect(sql).toMatch(/on conflict \(version\) do update/i);
    expect(sql).not.toMatch(/drop table/i);
    expect(sql).toMatch(/0 disables free shipping/i);
  });

  it("does not grant write access to anon", () => {
    const sql = readMigration(hotfixFile);
    expect(sql).not.toMatch(
      /grant insert on table public\.commerce_shipping_policies to anon/i,
    );
    expect(sql).not.toMatch(
      /grant all privileges on table public\.commerce_shipping_policies to anon/i,
    );
  });

  it("applies on an empty database and on an existing v1 table", async () => {
    const { runCommerceShippingPolicyMigrationScenarios } = await import(
      "../../../scripts/test-commerce-shipping-policies-migration.mjs"
    );
    const result = await runCommerceShippingPolicyMigrationScenarios();
    expect(result.ok).toBe(true);
    expect(result.empty).toHaveLength(1);
    expect(Number(result.empty[0].version)).toBe(2);
    expect(Number(result.empty[0].free_shipping_threshold_minor)).toBe(0);
    expect(result.upgrade).toHaveLength(2);
    expect(Number(result.upgrade.find((row) => Number(row.version) === 1)?.standard_shipping_minor)).toBe(
      8990,
    );
    expect(Number(result.upgrade.find((row) => Number(row.version) === 2)?.standard_shipping_minor)).toBe(
      10_000,
    );
  }, 30_000);
});
