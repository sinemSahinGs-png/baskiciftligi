/** Probe search vs popular; never print secrets. */
const SITE = "https://baskiciftligi.com";

async function probe(path) {
  const res = await fetch(`${SITE}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const json = await res.json();
  return {
    path,
    http: res.status,
    connected: json.thingiverseConnected,
    status: json.thingiverseStatus,
    count: (json.models || []).length,
    softError: json.softError || null,
    firstTitle: json.models?.[0]?.title?.slice(0, 40) || null,
    firstLicense: json.models?.[0]?.licenseCode || null,
    firstPricing: json.models?.[0]?.pricingAllowed ?? null,
  };
}

// wait for rate limit window
await new Promise((r) => setTimeout(r, 65000));

const paths = [
  "/api/hazir-modeller/search?source=thingiverse&page=1",
  "/api/hazir-modeller/search?source=thingiverse&q=vase&page=1",
  "/api/hazir-modeller/search?source=thingiverse&q=vazo&page=1",
  "/api/hazir-modeller/search?source=thingiverse&q=phone%20holder&page=1",
  "/api/hazir-modeller/search?source=thingiverse&q=" + encodeURIComponent("telefon tutucu") + "&page=1",
  "/api/hazir-modeller/search?source=thingiverse&q=" + encodeURIComponent("figür") + "&page=1",
  "/api/hazir-modeller/search?source=thingiverse&q=figurine&page=1",
];

const out = [];
for (const p of paths) {
  out.push(await probe(p));
  await new Promise((r) => setTimeout(r, 1500));
}
console.log(JSON.stringify(out, null, 2));
