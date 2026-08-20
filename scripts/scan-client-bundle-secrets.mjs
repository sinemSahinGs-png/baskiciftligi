import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

function loadKey() {
  const text = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
  const match = text.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m);
  if (!match) return "";
  return match[1].trim().replace(/^["']|["']$/g, "");
}

const secret = loadKey();
const patterns = ["SUPABASE_SERVICE_ROLE_KEY", "sb_secret_"];
if (secret) {
  patterns.push(secret);
}

const roots = [".next/static", ".next/server/chunks"];
let leaked = false;
for (const root of roots) {
  for (const pattern of patterns) {
    try {
      const out = execSync(
        `rg -l --fixed-strings ${JSON.stringify(pattern)} ${root}`,
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
      const files = out.trim().split(/\r?\n/).filter(Boolean);
      const clientFiles = files.filter((file) => file.includes(".next/static"));
      if (pattern === "SUPABASE_SERVICE_ROLE_KEY" || pattern === "sb_secret_") {
        console.log(`${pattern} file hits: ${files.length} (static=${clientFiles.length})`);
      } else {
        console.log(
          `service-role value hits: total=${files.length} static=${clientFiles.length}`,
        );
        if (clientFiles.length > 0) leaked = true;
      }
      if (pattern !== "SUPABASE_SERVICE_ROLE_KEY" && clientFiles.length > 0) {
        leaked = true;
      }
    } catch {
      if (pattern === "SUPABASE_SERVICE_ROLE_KEY" || pattern === "sb_secret_") {
        console.log(`${pattern} file hits: 0`);
      } else {
        console.log("service-role value hits: total=0 static=0");
      }
    }
  }
}

process.exit(leaked ? 1 : 0);
