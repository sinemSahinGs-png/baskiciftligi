/** @vitest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const migrationDir = path.join(process.cwd(), "supabase", "migrations");

function readMigration(name: string) {
  return readFileSync(path.join(migrationDir, name), "utf8");
}

describe("model_consultation_requests migrations", () => {
  const rlsFiles = [
    "20260830190000_model_consultation_requests.sql",
    "20260830220000_model_consultation_requests_rls_fix.sql",
  ] as const;

  for (const file of rlsFiles) {
    it(`${file} does not query public.profiles`, () => {
      const sql = readMigration(file);
      expect(sql).not.toMatch(/from\s+public\.profiles/i);
      expect(sql).not.toMatch(/references\s+public\.profiles/i);
    });

    it(`${file} is idempotent for table, indexes, and policies`, () => {
      const sql = readMigration(file);
      expect(sql).toMatch(/create table if not exists public\.model_consultation_requests/i);
      expect(sql).toMatch(/create index if not exists model_consultation_requests_status_idx/i);
      expect(sql).toMatch(/drop policy if exists model_consultation_requests_staff_all/i);
      expect(sql).toMatch(/create policy model_consultation_requests_service/i);
    });

    it(`${file} restricts client roles and grants service role`, () => {
      const sql = readMigration(file);
      expect(sql).toMatch(
        /revoke all on table public\.model_consultation_requests from anon, authenticated/i,
      );
      expect(sql).toMatch(
        /grant all privileges on table public\.model_consultation_requests to service_role/i,
      );
      expect(sql).toMatch(/for all\s+to service_role/i);
    });
  }

  it("license evaluation migration adds column idempotently", () => {
    const sql = readMigration("20260830230000_model_consultation_license_evaluation.sql");
    expect(sql).toMatch(/add column if not exists license_evaluation/i);
    expect(sql).not.toMatch(/drop table/i);
  });

  it("fix migration drops legacy staff policy before creating service policy", () => {
    const sql = readMigration("20260830220000_model_consultation_requests_rls_fix.sql");
    const staffDrop = sql.indexOf("drop policy if exists model_consultation_requests_staff_all");
    const serviceCreate = sql.indexOf("create policy model_consultation_requests_service");
    expect(staffDrop).toBeGreaterThan(-1);
    expect(serviceCreate).toBeGreaterThan(staffDrop);
  });
});
