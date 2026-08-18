import { readFileSync, rmSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/report-safety-flags.mjs <env-file>");
  process.exit(1);
}

const raw = readFileSync(file, "utf8");
const names = [
  "THINGIVERSE_FIXTURE_MODE",
  "ALLOW_PRODUCTION_DEMO_IMPORT",
  "ALLOW_DEMO_ADMIN_MUTATIONS",
];

for (const name of names) {
  const match = raw.match(new RegExp(`^${name}=(.*)$`, "m"));
  const value = (match?.[1] ?? "").trim().replace(/^['"]|['"]$/g, "").toLowerCase();
  console.log(`${name}=${value === "true" ? "enabled" : "disabled"}`);
}

rmSync(file, { force: true });
