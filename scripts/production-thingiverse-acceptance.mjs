/**
 * Production Thingiverse acceptance — never prints secret values.
 */
const SITE = process.env.SITE_URL || "https://baskiciftligi.com";

function assertNoSecret(label, text) {
  if (/THINGIVERSE_ACCESS_TOKEN\s*[:=]\s*['"]?[A-Za-z0-9_-]{16,}/i.test(text)) {
    throw new Error(`${label}: ACCESS_TOKEN value leak pattern`);
  }
  if (/Authorization:\s*Bearer\s+[A-Za-z0-9_-]{16,}/i.test(text)) {
    throw new Error(`${label}: Bearer token leak pattern`);
  }
}

async function getJson(path) {
  const res = await fetch(`${SITE}${path}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  const text = await res.text();
  assertNoSecret(path, text);
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${path} non-json status=${res.status}`);
  }
  return { status: res.status, json };
}

function summarize(models) {
  return (models || []).slice(0, 5).map((m) => ({
    kind: m.kind,
    id: m.id,
    title: String(m.title || m.titleTr || "").slice(0, 60),
    creator: m.creatorName || m.authorName || null,
    thumb: Boolean(m.thumbnailUrl || m.previewImageUrl),
    thumbHost: (() => {
      try {
        return m.thumbnailUrl ? new URL(m.thumbnailUrl).hostname : null;
      } catch {
        return "bad";
      }
    })(),
    license: m.licenseLabel || m.licenseName || null,
    licenseCode: m.licenseCode || null,
    pricingAllowed: m.pricingAllowed,
    sourceUrl: m.sourceUrl || null,
    category: m.categoryLabel || null,
  }));
}

const report = { site: SITE, checks: {} };

{
  const { status, json } = await getJson(
    "/api/hazir-modeller/search?source=thingiverse&page=1",
  );
  report.checks.popular = {
    http: status,
    connected: json.thingiverseConnected,
    tvStatus: json.thingiverseStatus,
    count: (json.models || []).length,
    hasMore: json.hasMore,
    softError: json.softError || null,
    sample: summarize(json.models),
  };
}

for (const q of ["vazo", "telefon tutucu", "figür"]) {
  const { status, json } = await getJson(
    `/api/hazir-modeller/search?source=thingiverse&q=${encodeURIComponent(q)}&page=1`,
  );
  report.checks[`search:${q}`] = {
    http: status,
    count: (json.models || []).length,
    hasMore: json.hasMore,
    softError: json.softError || null,
    sample: summarize(json.models),
  };
}

{
  const a = await getJson("/api/hazir-modeller/search?source=thingiverse&page=1");
  const b = await getJson("/api/hazir-modeller/search?source=thingiverse&page=2");
  const ids1 = new Set((a.json.models || []).map((m) => m.id));
  const ids2 = (b.json.models || []).map((m) => m.id);
  const overlap = ids2.filter((id) => ids1.has(id));
  report.checks.pagination = {
    page1: (a.json.models || []).length,
    page2: (b.json.models || []).length,
    hasMore1: a.json.hasMore,
    hasMore2: b.json.hasMore,
    overlapCount: overlap.length,
    overlapIds: overlap.slice(0, 5),
  };
}

{
  const { json } = await getJson(
    "/api/hazir-modeller/search?source=thingiverse&page=1",
  );
  const models = json.models || [];
  report.checks.license = {
    total: models.length,
    pricingAllowed: models.filter((m) => m.pricingAllowed).length,
    pricingBlocked: models.filter((m) => !m.pricingAllowed).length,
    codes: [...new Set(models.map((m) => m.licenseCode || "null"))].slice(0, 12),
  };
}

{
  const { json } = await getJson(
    "/api/hazir-modeller/search?source=thingiverse&page=1",
  );
  const urls = (json.models || [])
    .map((m) => m.thumbnailUrl)
    .filter(Boolean)
    .slice(0, 5);
  const thumbs = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      thumbs.push({ host: new URL(url).hostname, status: res.status });
    } catch {
      thumbs.push({ host: "error", status: 0 });
    }
  }
  report.checks.thumbnails = thumbs;
}

{
  const res = await fetch(`${SITE}/hazir-modeller`, { cache: "no-store" });
  const html = await res.text();
  assertNoSecret("hazir-modeller-html", html);
  report.checks.pageHtml = {
    status: res.status,
    hasLibrary:
      html.includes("data-model-library") || html.includes("Hazır modeller"),
    hasAccessTokenValue:
      /THINGIVERSE_ACCESS_TOKEN\s*[:=]\s*['"]?[A-Za-z0-9_-]{16,}/i.test(html),
  };
}

{
  const { json } = await getJson(
    "/api/hazir-modeller/search?source=thingiverse&page=1",
  );
  const first = (json.models || [])[0];
  if (first) {
    const res = await fetch(
      `${SITE}/api/hazir-modeller/source-open?kind=thingiverse&id=${encodeURIComponent(first.id)}`,
      { redirect: "manual", cache: "no-store" },
    );
    const loc = res.headers.get("location");
    report.checks.sourceOpen = {
      id: first.id,
      status: res.status,
      location: loc,
      matchesCanonical:
        loc === `https://www.thingiverse.com/thing:${first.id}` ||
        loc === first.sourceUrl,
    };
  }
}

console.log(JSON.stringify(report, null, 2));
