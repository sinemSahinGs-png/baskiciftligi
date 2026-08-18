import { readFileSync } from "node:fs";
import path from "node:path";

const productionMode = process.argv.includes("--production");
const productionSiteUrl = "https://baskiciftligi.com";

const mandatory = ["NEXT_PUBLIC_SITE_URL"];
const optional = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "THINGIVERSE_CLIENT_ID",
  "THINGIVERSE_CLIENT_SECRET",
  "THINGIVERSE_ACCESS_TOKEN",
  "THINGIVERSE_REDIRECT_URI",
  "MANUFACTURING_QUOTE_HMAC_SECRET",
  "SLICER_WORKER_SECRET",
  "SLICER_WORKER_URL",
  "SLICER_QUEUE_URL",
  "SLICER_WEBHOOK_SECRET",
  "MODEL_CONVERTER_URL",
  "PAYTR_MERCHANT_ID",
  "PAYTR_MERCHANT_KEY",
  "PAYTR_MERCHANT_SALT",
  "PAYTR_CALLBACK_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "NEXT_SERVER_ACTIONS_ENCRYPTION_KEY",
];

function present(name) {
  const value = process.env[name];
  return Boolean(value && value.trim());
}

const examplePath = path.join(process.cwd(), ".env.example");
const exampleNames = readFileSync(examplePath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.match(/^([A-Z0-9_]+)=/))
  .filter(Boolean)
  .map((match) => match[1]);

const missingMandatory = mandatory.filter((name) => {
  if (!productionMode) {
    return false;
  }
  return !present(name);
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
if (
  productionMode &&
  siteUrl &&
  siteUrl !== productionSiteUrl
) {
  missingMandatory.push("NEXT_PUBLIC_SITE_URL (must be https://baskiciftligi.com)");
}

const missingOptional = optional.filter((name) => !present(name));

console.log("Deployment readiness");
console.log(`Mode: ${productionMode ? "production" : "local"}`);
console.log(`Lockfile: ${exampleNames.length ? "package-lock.json expected" : "unknown"}`);
console.log("Mandatory:");
for (const name of mandatory) {
  const ok = productionMode ? present(name) && siteUrl === productionSiteUrl : true;
  console.log(`  ${ok ? "ok" : "missing"}  ${name}`);
}
console.log("Optional integrations:");
for (const name of optional) {
  console.log(`  ${present(name) ? "configured" : "unconfigured"}  ${name}`);
}

console.log(
  `Optional unconfigured: ${missingOptional.length ? missingOptional.join(", ") : "none"}`,
);
if (missingMandatory.length > 0) {
  console.error("Mandatory production configuration is incomplete.");
  process.exit(1);
}

console.log("Website can deploy with optional providers unconfigured.");
