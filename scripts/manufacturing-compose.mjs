import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const action = process.argv[2] ?? "up";
const envFile = path.join(process.cwd(), ".env.local");
const args = ["compose"];
if (existsSync(envFile)) {
  args.push("--env-file", envFile);
}

if (action === "up") {
  args.push("up", "-d", "--build", "slicer-worker");
} else if (action === "down") {
  args.push("stop", "slicer-worker");
} else if (action === "logs") {
  args.push("logs", "--no-color", "--tail", "200", "slicer-worker");
} else if (action === "ps") {
  args.push("ps");
} else {
  console.error("Usage: node scripts/manufacturing-compose.mjs <up|down|logs|ps>");
  process.exit(2);
}

const result = spawnSync("docker", args, { stdio: "inherit", shell: false });
process.exit(result.status ?? 1);
