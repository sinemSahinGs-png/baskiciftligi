import { execFileSync } from "node:child_process";

const deploymentId = process.argv[2] || "dpl_HshfRNfCxTL1i1Unwes2AaUHFsHJ";

let raw = "";
try {
  raw = execFileSync(
    "npx",
    [
      "vercel",
      "logs",
      deploymentId,
      "--environment",
      "production",
      "--since",
      "2h",
      "--limit",
      "100",
      "--json",
    ],
    { encoding: "utf8", timeout: 60_000 },
  );
} catch (error) {
  raw = String(error?.stdout || "") + String(error?.stderr || error?.message || "");
}

const leak =
  /THINGIVERSE_ACCESS_TOKEN\s*[:=]\s*['"]?[A-Za-z0-9_-]{16,}/i.test(raw) ||
  /Authorization:\s*Bearer\s+[A-Za-z0-9_-]{16,}/i.test(raw) ||
  /CLIENT_SECRET\s*[:=]\s*['"]?[A-Za-z0-9_-]{8,}/i.test(raw);

console.log(
  JSON.stringify(
    {
      deploymentId,
      bytes: raw.length,
      lines: raw.split("\n").length,
      secretValueLeak: leak,
    },
    null,
    2,
  ),
);
if (leak) process.exitCode = 2;
