import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";

const hotfixPath = path.join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260902120000_owner_shipping_policy_v2.sql",
);

export const HOTFIX_SQL = readFileSync(hotfixPath, "utf8");

export const SUPABASE_ROLES_SQL = `
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin; exception when duplicate_object then null; end $$;
`;

export const V1_TABLE_SQL = `
create table if not exists public.commerce_shipping_policies (
  version integer primary key check (version > 0),
  currency text not null default 'TRY' check (currency ~ '^[A-Z]{3}$'),
  standard_shipping_minor bigint not null check (standard_shipping_minor >= 0),
  free_shipping_threshold_minor bigint not null
    check (free_shipping_threshold_minor >= 0),
  activated_at timestamptz,
  activated_by uuid,
  notes text,
  created_at timestamptz not null default now()
);
insert into public.commerce_shipping_policies (
  version, currency, standard_shipping_minor, free_shipping_threshold_minor,
  activated_at, notes
) values (1, 'TRY', 8990, 150000, now(), 'pre-existing v1')
on conflict (version) do nothing;
`;

export async function applyCommerceShippingHotfix(db) {
  await db.exec(HOTFIX_SQL);
}

export async function createEmptyShippingPolicyDatabase() {
  const db = new PGlite();
  await db.exec(SUPABASE_ROLES_SQL);
  return db;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export async function runCommerceShippingPolicyMigrationScenarios() {
  const empty = await createEmptyShippingPolicyDatabase();
  await applyCommerceShippingHotfix(empty);
  await applyCommerceShippingHotfix(empty);
  const emptyRows = await empty.query(
    "select version, currency, standard_shipping_minor, free_shipping_threshold_minor from public.commerce_shipping_policies order by version",
  );
  assert(emptyRows.rows.length === 1, `empty DB expected 1 row, got ${emptyRows.rows.length}`);
  assert(emptyRows.rows[0].version === 2, "empty DB missing version 2");
  assert(emptyRows.rows[0].currency === "TRY", "empty DB currency");
  assert(Number(emptyRows.rows[0].standard_shipping_minor) === 10000, "empty DB shipping");
  assert(Number(emptyRows.rows[0].free_shipping_threshold_minor) === 0, "empty DB threshold");

  const upgrade = await createEmptyShippingPolicyDatabase();
  await upgrade.exec(V1_TABLE_SQL);
  await applyCommerceShippingHotfix(upgrade);
  await applyCommerceShippingHotfix(upgrade);
  const upgradeRows = await upgrade.query(
    "select version, standard_shipping_minor, free_shipping_threshold_minor from public.commerce_shipping_policies order by version",
  );
  assert(upgradeRows.rows.length === 2, `upgrade expected 2 rows, got ${upgradeRows.rows.length}`);
  const v1 = upgradeRows.rows.find((row) => Number(row.version) === 1);
  const v2 = upgradeRows.rows.find((row) => Number(row.version) === 2);
  assert(Number(v1.standard_shipping_minor) === 8990, "upgrade mutated v1 shipping");
  assert(Number(v1.free_shipping_threshold_minor) === 150000, "upgrade mutated v1 threshold");
  assert(Number(v2.standard_shipping_minor) === 10000, "upgrade v2 shipping");
  assert(Number(v2.free_shipping_threshold_minor) === 0, "upgrade v2 threshold");

  return {
    ok: true,
    empty: emptyRows.rows,
    upgrade: upgradeRows.rows,
  };
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1] ?? "")) {
  const result = await runCommerceShippingPolicyMigrationScenarios();
  console.log(JSON.stringify(result, (_, value) => (typeof value === "bigint" ? Number(value) : value)));
}
