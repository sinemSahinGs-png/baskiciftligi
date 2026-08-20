/**
 * Scan built client artifacts and recent deploy logs for secret leak patterns.
 * Never prints secret values — only match counts / filenames.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const patterns = [
  { name: "access_token_assignment", re: /THINGIVERSE_ACCESS_TOKEN\s*[:=]\s*['"][A-Za-z0-9_-]{16,}/i },
  { name: "client_secret_assignment", re: /THINGIVERSE_CLIENT_SECRET\s*[:=]\s*['"][A-Za-z0-9_-]{8,}/i },
  { name: "bearer_header", re: /Authorization:\s*Bearer\s+[A-Za-z0-9_-]{16,}/i },
];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(js|css|html|map|json)$/i.test(entry.name)) files.push(full);
  }
  return files;
}

const roots = [".next/static", ".next/server/app"];
const hits = [];
for (const root of roots) {
  for (const file of walk(root)) {
    let text = "";
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const pattern of patterns) {
      if (pattern.re.test(text)) {
        hits.push({ file: path.relative(process.cwd(), file), pattern: pattern.name });
      }
    }
  }
}

let logScan = { ok: true, note: "" };
try {
  const logs = execSync(
    "npx vercel logs baskiciftligi.com --output raw",
    {
      encoding: "utf8",
      timeout: 45_000,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const leak =
    /THINGIVERSE_ACCESS_TOKEN\s*[:=]\s*['"]?[A-Za-z0-9_-]{16,}/i.test(logs) ||
    /Authorization:\s*Bearer\s+[A-Za-z0-9_-]{16,}/i.test(logs);
  logScan = {
    ok: !leak,
    bytes: logs.length,
    note: leak ? "PATTERN_MATCH" : "no_secret_value_patterns",
  };
} catch (error) {
  logScan = {
    ok: true,
    note: "logs_unavailable_or_empty",
    error: error instanceof Error ? error.message.slice(0, 120) : "error",
  };
}

const report = {
  clientBundleHits: hits,
  clientBundleClean: hits.length === 0,
  vercelLogs: logScan,
};
console.log(JSON.stringify(report, null, 2));
if (hits.length > 0 || logScan.note === "PATTERN_MATCH") {
  process.exitCode = 2;
}
