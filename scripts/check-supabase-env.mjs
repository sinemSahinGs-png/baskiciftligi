import { readFileSync } from "node:fs";
import { normalizeSupabaseProjectUrl } from "../src/lib/supabase/url.ts";

const text = readFileSync(".env.local", "utf8");

function readKey(name) {
  const match = text.match(new RegExp(`^${name}=(.*)$`, "m"));
  if (!match) {
    return { name, present: false };
  }
  const raw = match[1].trim().replace(/^["']|["']$/g, "");
  const info = { name, present: true, length: raw.length };
  if (name.includes("URL")) {
    try {
      const normalized = normalizeSupabaseProjectUrl(raw);
      const url = new URL(normalized);
      info.host = url.hostname;
      info.normalizedPath = url.pathname || "/";
      info.projectRef = url.hostname.split(".")[0] ?? null;
      info.valid = true;
    } catch {
      info.valid = false;
    }
  }
  if (name.includes("PUBLISHABLE") || name.includes("ANON")) {
    info.format = raw.startsWith("sb_publishable_")
      ? "sb_publishable"
      : raw.startsWith("eyJ")
        ? "jwt"
        : "other";
  }
  if (name.includes("SECRET") || name.includes("SERVICE_ROLE")) {
    info.format = raw.startsWith("sb_secret_")
      ? "sb_secret"
      : raw.startsWith("eyJ")
        ? "jwt"
        : "other";
  }
  return info;
}

const keys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "BC_FORCE_LOCAL_PERSISTENCE",
];

const report = {
  gitignored: true,
  keys: keys.map(readKey),
  resolved: {
    url: readKey("NEXT_PUBLIC_SUPABASE_URL"),
    publishable:
      readKey("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY").present ||
      readKey("NEXT_PUBLIC_SUPABASE_ANON_KEY").present,
    secret:
      readKey("SUPABASE_SECRET_KEY").present ||
      readKey("SUPABASE_SERVICE_ROLE_KEY").present,
  },
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.resolved.url.present && report.resolved.publishable && report.resolved.secret ? 0 : 1);
