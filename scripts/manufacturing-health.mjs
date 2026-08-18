import { spawnSync } from "node:child_process";

function run(command, args) {
  return spawnSync(command, args, { encoding: "utf8", shell: false, timeout: 20_000 });
}

const info = run("docker", ["info"]);
if (info.status !== 0) {
  const err = `${info.stderr || info.stdout || "docker info failed"}`.trim();
  console.error("slicer-worker health: Docker engine unreachable.");
  console.error(err.slice(0, 800));
  process.exit(1);
}

const compose = run("docker", ["compose", "ps"]);
if (compose.stdout) {
  process.stdout.write(compose.stdout);
}

try {
  const response = await fetch("http://127.0.0.1:8788/health", {
    signal: AbortSignal.timeout(2000),
  });
  const body = await response.text();
  console.log(`worker /health ${response.status}`);
  console.log(body.slice(0, 500));
  process.exit(response.ok ? 0 : 1);
} catch (error) {
  console.error(
    "slicer-worker is not answering on http://127.0.0.1:8788/health",
  );
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
