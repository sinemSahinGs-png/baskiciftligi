const SITE = "https://baskiciftligi.com";

function assertNoSecret(text) {
  if (/THINGIVERSE_ACCESS_TOKEN\s*[:=]\s*['"]?[A-Za-z0-9_-]{16,}/i.test(text)) {
    throw new Error("secret leak");
  }
}

async function getJson(path) {
  const res = await fetch(`${SITE}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  assertNoSecret(text);
  try {
    return { status: res.status, json: JSON.parse(text) };
  } catch {
    return { status: res.status, json: null, len: text.length };
  }
}

function slimSearch(label, payload) {
  const models = payload.json?.models || payload.json?.items || [];
  return {
    label,
    status: payload.status,
    connected: payload.json?.thingiverseConnected ?? null,
    tvStatus: payload.json?.thingiverseStatus ?? null,
    count: models.length,
    kinds: [...new Set(models.map((m) => m.kind || m.source))],
    softError: payload.json?.softError || null,
    firstTitle: models[0]
      ? String(models[0].title || models[0].titleTr || "").slice(0, 50)
      : null,
  };
}

const htmlRes = await fetch(`${SITE}/hazir-modeller`, { cache: "no-store" });
const html = await htmlRes.text();
assertNoSecret(html);

const rscHint = {
  status: htmlRes.status,
  cacheControl: htmlRes.headers.get("cache-control"),
  xVercelCache: htmlRes.headers.get("x-vercel-cache"),
  hasThingiverseWord: /Thingiverse/i.test(html),
  hasTopluluk: /Topluluk modelleri/i.test(html),
  hasTablist: /role=\"tablist\"|Model kaynakları/i.test(html),
  // RSC often embeds props as JSON-ish text
  hasThingiverseEnabledTrue: /thingiverseEnabled\":true|thingiverseEnabled\": true/.test(html),
  hasThingiverseEnabledFalse: /thingiverseEnabled\":false|thingiverseEnabled\": false/.test(html),
  tabLabels: [...html.matchAll(/Baskı Çiftliği modelleri|Küratörlü modeller|Thingiverse|Topluluk modelleri|Tümü/g)].map((m) => m[0]),
};

const searchAll = slimSearch(
  "search-all-vazo",
  await getJson(`/api/hazir-modeller/search?q=${encodeURIComponent("vazo")}&source=all`),
);
const searchTv = slimSearch(
  "search-tv-vazo",
  await getJson(`/api/hazir-modeller/search?q=${encodeURIComponent("vazo")}&source=thingiverse`),
);
const discover = await getJson(`/api/models/discover?q=${encodeURIComponent("vazo")}`);
const discoverSlim = {
  status: discover.status,
  keys: discover.json ? Object.keys(discover.json) : [],
  count: Array.isArray(discover.json?.items)
    ? discover.json.items.length
    : Array.isArray(discover.json?.models)
      ? discover.json.models.length
      : Array.isArray(discover.json?.results)
        ? discover.json.results.length
        : null,
  sources: (discover.json?.items || discover.json?.models || []).map((i) => i.source || i.kind).slice(0, 8),
  configured: discover.json?.providers || discover.json?.status || null,
};

const mfg = await getJson("/api/manufacturing/status");
const mfgSlim = {
  status: mfg.status,
  thingiverse: mfg.json?.thingiverse ?? mfg.json?.integrations?.thingiverse ?? null,
  hasTokenField: Boolean(
    mfg.json && JSON.stringify(mfg.json).includes("THINGIVERSE"),
  ),
};

console.log(
  JSON.stringify(
    { html: rscHint, searchAll, searchTv, discover: discoverSlim, manufacturing: mfgSlim },
    null,
    2,
  ),
);
