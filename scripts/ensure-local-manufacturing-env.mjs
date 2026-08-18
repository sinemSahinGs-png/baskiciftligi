import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const target = path.join(process.cwd(), ".env.local");

function parseEnv(text) {
  const values = new Map();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) {
      continue;
    }
    const index = line.indexOf("=");
    values.set(line.slice(0, index), line.slice(index + 1));
  }
  return values;
}

const existing = existsSync(target) ? readFileSync(target, "utf8") : "";
const values = parseEnv(existing);
const additions = [];

function missing(key) {
  const value = values.get(key);
  return !value || value.trim() === "";
}

if (missing("MANUFACTURING_QUOTE_HMAC_SECRET")) {
  additions.push(
    `MANUFACTURING_QUOTE_HMAC_SECRET=${randomBytes(32).toString("hex")}`,
  );
}
if (missing("SLICER_WORKER_SECRET")) {
  additions.push(`SLICER_WORKER_SECRET=${randomBytes(32).toString("hex")}`);
}
if (missing("SLICER_WORKER_URL")) {
  additions.push("SLICER_WORKER_URL=http://127.0.0.1:8788");
}

if (additions.length === 0) {
  console.log("Local manufacturing env keys already present.");
  process.exit(0);
}

const block = [
  "",
  "# Local manufacturing secrets — never commit, never print.",
  ...additions,
  "",
].join("\n");
writeFileSync(target, `${existing.replace(/\s*$/, "")}${block}`, "utf8");
console.log(`Wrote ${additions.length} manufacturing env key(s) to .env.local (values not printed).`);
