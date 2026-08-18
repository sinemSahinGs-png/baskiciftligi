const base = process.argv[2] || process.env.DEPLOYMENT_BASE_URL;
if (!base) {
  console.error("Usage: node scripts/smoke-deployed.mjs <https://host>");
  process.exit(1);
}

const origin = new URL(base).origin;
const routes = [
  "/",
  "/magaza",
  "/hazir-modeller",
  "/model-yukle",
  "/kurumsal-uretim",
  "/hizmetler/3d-baski",
  "/giris",
  "/admin",
  "/sitemap.xml",
  "/robots.txt",
  "/manifest.webmanifest",
  "/opengraph-image",
  "/api/health",
  "/icon.svg",
  "/this-route-does-not-exist-baski-ciftligi",
];

const failures = [];

async function request(path, init = {}) {
  const url = new URL(path, origin);
  const response = await fetch(url, {
    redirect: "manual",
    ...init,
  });
  return { url: url.toString(), response };
}

for (const route of routes) {
  const { url, response } = await request(route);
  const expected =
    route === "/this-route-does-not-exist-baski-ciftligi"
      ? [404]
      : route === "/admin"
        ? [200, 307, 308, 302]
        : [200];
  const ok = expected.includes(response.status);
  const line = `${response.status} ${route}`;
  if (ok) {
    console.log(`ok   ${line}`);
  } else {
    console.log(`fail ${line} (${url})`);
    failures.push(line);
  }
}

const health = await fetch(new URL("/api/health", origin));
if (health.ok) {
  const body = await health.json();
  if (body.ok !== true || body.service !== "baski-ciftligi") {
    failures.push("health payload");
  }
  const serialized = JSON.stringify(body);
  if (
    /service_role|eyJ|sk_live|postgres:\/\//i.test(serialized) ||
    serialized.includes(".octo-data")
  ) {
    failures.push("health leaked secret-like data");
  }
  console.log(
    `health catalog=${body.catalog} supabase=${body.supabase} thingiverse=${body.thingiverse} worker=${body.slicerWorker} payment=${body.payment}`,
  );
} else {
  failures.push(`health ${health.status}`);
}

const home = await fetch(origin);
const html = await home.text();
if (!/Baskı Çiftliği|Baski Çiftliği|Baskı Ciftliği/i.test(html)) {
  failures.push("homepage missing Baskı Çiftliği");
}
if (/localhost:3000|octostudio|somut/i.test(html)) {
  failures.push("homepage contains development or old brand URL");
}

if (failures.length > 0) {
  console.error("Smoke failures:");
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  process.exit(1);
}

console.log(`Smoke passed for ${origin}`);
