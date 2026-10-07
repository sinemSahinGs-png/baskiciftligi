import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("wholesale RLS isolation", () => {
  const sql = readFileSync(
    path.join(process.cwd(), "supabase/migrations/20261007120000_wholesale_lighters.sql"),
    "utf8",
  );

  it("enables RLS and does not allow anon writes", () => {
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("wholesale_orders_owner_select");
    expect(sql).toContain("user_id = auth.uid()");
    expect(sql).toContain("revoke insert, update, delete on public.wholesale_orders from anon, authenticated");
    expect(sql).not.toContain("for insert to anon");
    expect(sql).not.toContain("for all to public");
  });
});
