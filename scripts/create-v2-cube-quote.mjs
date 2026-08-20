/**
 * Fresh unique cube + overhang quotes against the local dev server.
 * Asserts actual support detection, v2 checksum, and /api/cart/price schema.
 *
 * Usage: node scripts/create-v2-cube-quote.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const OUT = path.join(
  process.cwd(),
  "test-results",
  "pricing-calibration",
  "v2-live-cube-quote.json",
);

const cookieJar = new Map();

function storeCookies(response) {
  const raw = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  for (const cookie of raw) {
    const pair = cookie.split(";", 1)[0];
    const eq = pair.indexOf("=");
    if (eq > 0) {
      cookieJar.set(pair.slice(0, eq), pair.slice(eq + 1));
    }
  }
}

function cookieHeader() {
  return [...cookieJar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
}

async function request(url, init = {}) {
  const headers = new Headers(init.headers ?? {});
  const cookie = cookieHeader();
  if (cookie) {
    headers.set("cookie", cookie);
  }
  const response = await fetch(url, { ...init, headers });
  storeCookies(response);
  return response;
}

function asciiSolid(name, boxes) {
  const faces = [];
  for (const { origin, size } of boxes) {
    const [ox, oy, oz] = origin;
    const x = ox + size[0];
    const y = oy + size[1];
    const z = oz + size[2];
    faces.push(
      [[ox, oy, oz], [x, oy, oz], [x, y, oz]],
      [[ox, oy, oz], [x, y, oz], [ox, y, oz]],
      [[ox, oy, z], [x, y, z], [x, oy, z]],
      [[ox, oy, z], [ox, y, z], [x, y, z]],
      [[ox, oy, oz], [ox, oy, z], [x, oy, z]],
      [[ox, oy, oz], [x, oy, z], [x, oy, oz]],
      [[ox, y, oz], [x, y, oz], [x, y, z]],
      [[ox, y, oz], [x, y, z], [ox, y, z]],
      [[ox, oy, oz], [ox, y, oz], [ox, y, z]],
      [[ox, oy, oz], [ox, y, z], [ox, oy, z]],
      [[x, oy, oz], [x, oy, z], [x, y, z]],
      [[x, oy, oz], [x, y, z], [x, y, oz]],
    );
  }
  const body = faces
    .map(
      (triangle) => `  facet normal 0 0 0
    outer loop
      vertex ${triangle[0].join(" ")}
      vertex ${triangle[1].join(" ")}
      vertex ${triangle[2].join(" ")}
    endloop
  endfacet`,
    )
    .join("\n");
  const contents = `solid ${name}\n${body}\nendsolid ${name}\n`;
  writeFileSync(path.join(os.tmpdir(), `${name}.stl`), contents, "utf8");
  return { filename: `${name}.stl`, contents };
}

function uniqueCube() {
  return asciiSolid(`v2-cube-${Date.now().toString(36)}`, [
    { origin: [0, 0, 0], size: [20, 20, 20.37] },
  ]);
}

function uniqueOverhang() {
  return asciiSolid(`v2-overhang-${Date.now().toString(36)}`, [
    { origin: [10, 10, 0], size: [4, 4, 16] },
    { origin: [0, 0, 16], size: [24, 24, 3] },
  ]);
}

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const health = await request(`${BASE}/api/health`, { signal: AbortSignal.timeout(2000) });
      if (health.ok) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Dev server not reachable at ${BASE}. Run: npm run dev`);
}

async function uploadMesh(mesh) {
  const form = new FormData();
  form.set("file", new Blob([mesh.contents], { type: "model/stl" }), mesh.filename);
  form.set("rightsConfirmed", "true");
  form.set("materialId", "pla");
  form.set("colorId", "black");
  form.set("qualityId", "standart");
  form.set("infillPercent", "20");
  form.set("supports", "auto");
  form.set("scalePercent", "100");
  form.set("quantity", "1");
  form.set("unit", "mm");
  const upload = await request(`${BASE}/api/manufacturing/uploads`, {
    method: "POST",
    body: form,
  });
  if (!upload.ok) {
    throw new Error(`Upload failed ${upload.status}: ${await upload.text()}`);
  }
  return upload.json();
}

async function waitForQuote(jobId) {
  const deadline = Date.now() + 8 * 60_000;
  while (Date.now() < deadline) {
    const jobRes = await request(`${BASE}/api/manufacturing/jobs/${jobId}`);
    if (!jobRes.ok) {
      throw new Error(`Job poll failed ${jobRes.status}`);
    }
    const job = await jobRes.json();
    if (job.quoteId && (job.state === "priced" || job.state === "needs_review")) {
      const quoteRes = await request(`${BASE}/api/manufacturing/quotes/${job.quoteId}`);
      if (!quoteRes.ok) {
        throw new Error(`Quote fetch failed ${quoteRes.status}`);
      }
      return { job, quote: await quoteRes.json() };
    }
    if (job.state === "failed") {
      throw new Error(`Job failed: ${job.errorMessage ?? "unknown"}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error("Timed out waiting for priced quote");
}

function readStoredQuote(quoteId) {
  const store = JSON.parse(
    readFileSync(path.join(process.cwd(), ".octo-data", "manufacturing", "store.json"), "utf8"),
  );
  return {
    stored: store.quotes.find((item) => item.id === quoteId),
    active: store.pricing
      .filter((item) => item.activatedAt)
      .sort((a, b) => b.version - a.version)[0],
    v1: store.quotes.find((item) => item.pricingVersion === 1),
  };
}

await waitForServer();

const cubeMesh = uniqueCube();
const uploaded = await uploadMesh(cubeMesh);
if (uploaded.existing) {
  throw new Error("Fresh cube reused an existing job; checksum was not unique.");
}
const { quote } = await waitForQuote(uploaded.jobId);
const { stored, active, v1 } = readStoredQuote(quote.id);

const addCart = await request(`${BASE}/api/manufacturing/quotes/${quote.id}/cart`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({}),
});
const addCartJson = addCart.ok ? await addCart.json() : { error: await addCart.text() };

const tamper = await request(`${BASE}/api/manufacturing/quotes/${quote.id}/cart`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ unitPriceMinor: 1 }),
});
const priceTamper = await request(`${BASE}/api/cart/price`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    lines: [
      {
        productId: `mfq:${quote.id}`,
        quantity: 1,
        quoteId: quote.id,
        unitPriceMinor: 1,
      },
    ],
  }),
});
const shippingTamper = await request(`${BASE}/api/cart/price`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    lines: [
      {
        productId: `mfq:${quote.id}`,
        quantity: 1,
        quoteId: quote.id,
      },
    ],
    estimatedShippingMinor: 0,
  }),
});

const adminBreakdown = await request(`${BASE}/api/admin/manufacturing/quotes/${quote.id}`);
const adminBreakdownJson = adminBreakdown.ok ? await adminBreakdown.json() : null;

const cartPrice = await request(`${BASE}/api/cart/price`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    lines: [
      {
        productId: `mfq:${quote.id}`,
        quantity: 1,
        quoteId: quote.id,
      },
    ],
  }),
});
const cart = cartPrice.ok ? await cartPrice.json() : { error: await cartPrice.text() };

const reused = await uploadMesh(cubeMesh);
const reuseQuote =
  reused.jobId === uploaded.jobId
    ? (await waitForQuote(reused.jobId)).quote
    : null;

const overhangMesh = uniqueOverhang();
const overhangUpload = await uploadMesh(overhangMesh);
const overhang = await waitForQuote(overhangUpload.jobId);
const overhangStored = readStoredQuote(overhang.quote.id).stored;

const result = {
  cube: {
    jobId: uploaded.jobId,
    quoteId: quote.id,
    existing: Boolean(uploaded.existing),
    quote,
    stored: {
      pricingVersion: stored?.pricingVersion,
      pricingChecksum: stored?.pricingChecksum,
      supportUsed: stored?.metrics?.supportUsed,
      supportGenerated: stored?.metrics?.supportGenerated,
      supportMaterialMm: stored?.metrics?.supportMaterialMm,
      supportMaterialGrams: stored?.metrics?.supportMaterialGrams,
      supportLayerCount: stored?.metrics?.supportLayerCount,
      gcodeParserVersion: stored?.metrics?.gcodeParserVersion,
      supportFeeMinor: stored?.internalBreakdown?.supportFeeMinor,
      grossMinor: stored?.publicBreakdown?.grossMinor,
    },
    addCartStatus: addCart.status,
    addCart: addCartJson,
    cartPriceStatus: cartPrice.status,
    cart,
    tamperCartStatus: tamper.status,
    tamperPriceStatus: priceTamper.status,
    tamperShippingStatus: shippingTamper.status,
    publicHasInternal: Object.prototype.hasOwnProperty.call(quote, "internal"),
    adminBreakdownStatus: adminBreakdown.status,
    adminHasInternal: Boolean(adminBreakdownJson?.internalBreakdown),
    reuse: {
      existing: Boolean(reused.existing),
      jobId: reused.jobId,
      sameJob: reused.jobId === uploaded.jobId,
      sameGross: reuseQuote?.breakdown?.grossMinor === quote.breakdown?.grossMinor,
    },
  },
  overhang: {
    jobId: overhangUpload.jobId,
    quoteId: overhang.quote.id,
    metrics: overhang.quote.metrics,
    grossMinor: overhang.quote.breakdown?.grossMinor,
    supportFeeMinor: overhangStored?.internalBreakdown?.supportFeeMinor,
    gcodeParserVersion: overhangStored?.metrics?.gcodeParserVersion,
  },
  active: {
    formulaId: active?.formulaId,
    version: active?.version,
    checksum: active?.checksum,
  },
  frozenV1: v1
    ? {
        id: v1.id,
        pricingVersion: v1.pricingVersion,
        pricingChecksum: v1.pricingChecksum,
        grossMinor: v1.publicBreakdown?.grossMinor,
        supportUsed: v1.metrics?.supportUsed,
      }
    : null,
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`, "utf8");

const failures = [];
if (stored?.pricingVersion !== 2) failures.push("cube not priced with v2");
if (stored?.pricingChecksum !== active?.checksum) failures.push("cube checksum mismatch");
if (stored?.metrics?.supportGenerated !== false) failures.push("cube supportGenerated must be false");
if (stored?.internalBreakdown?.supportFeeMinor !== 0) failures.push("cube support labor must be 0");
if (result.cube.publicHasInternal) {
  failures.push("public quote exposed internal field");
}
if (JSON.stringify(quote).includes("targetMarginRate") || JSON.stringify(quote).includes("riskRate")) {
  failures.push("public quote leaked pricing rates");
}
if (addCart.status !== 200) failures.push(`quote cart POST ${addCart.status}`);
if (cartPrice.status !== 200) failures.push(`cart/price POST ${cartPrice.status}`);
if (tamper.status !== 409) failures.push("client quote cart price was accepted");
if (priceTamper.status !== 409) failures.push("client cart/price unitPriceMinor was accepted");
if (shippingTamper.status !== 409) failures.push("client cart/price shipping was accepted");
if (adminBreakdown.status !== 200) failures.push(`admin breakdown GET ${adminBreakdown.status}`);
if (!adminBreakdownJson?.internalBreakdown) failures.push("admin breakdown missing internalBreakdown");
if (!Array.isArray(cart.lines) || !cart.lines.some((line) => line.quoteId === quote.id)) {
  failures.push("cart/price missing matching quote line");
}
if (cart.subtotalMinor !== quote.breakdown.grossMinor) {
  failures.push(`subtotalMinor ${cart.subtotalMinor} != quote gross ${quote.breakdown.grossMinor}`);
}
if (cart.estimatedShippingMinor !== 8990) {
  failures.push(`shipping ${cart.estimatedShippingMinor} != 8990`);
}
if (cart.totalMinor !== cart.subtotalMinor + cart.estimatedShippingMinor) {
  failures.push("totalMinor != subtotalMinor + estimatedShippingMinor");
}
if (!reused.existing || reused.jobId !== uploaded.jobId) {
  failures.push("idempotent re-upload did not reuse the completed cube job");
}
if (overhangStored?.metrics?.supportGenerated !== true) {
  failures.push("overhang supportGenerated must be true");
}
if (overhangStored?.internalBreakdown?.supportFeeMinor !== 1500) {
  failures.push("overhang support-removal labor must be 1500");
}
if (v1 && v1.publicBreakdown?.grossMinor !== 23806) {
  failures.push("frozen v1 cube quote was modified");
}

console.log("v2 live cube quote");
console.log(`  quoteId: ${quote.id}`);
console.log(`  jobId: ${uploaded.jobId}`);
console.log(`  supportGenerated: ${stored?.metrics?.supportGenerated}`);
console.log(`  supportFeeMinor: ${stored?.internalBreakdown?.supportFeeMinor}`);
console.log(`  grossMinor: ${quote.breakdown?.grossMinor}`);
console.log(`  cart.subtotalMinor: ${cart.subtotalMinor}`);
console.log(`  cart.estimatedShippingMinor: ${cart.estimatedShippingMinor}`);
console.log(`  cart.totalMinor: ${cart.totalMinor}`);
console.log(`  overhang supportGenerated: ${overhangStored?.metrics?.supportGenerated}`);
console.log(`  overhang supportFeeMinor: ${overhangStored?.internalBreakdown?.supportFeeMinor}`);
console.log(`  overhang grossMinor: ${overhang.quote.breakdown?.grossMinor}`);
console.log(`  written: ${OUT}`);

if (failures.length > 0) {
  console.error("FAIL:");
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}
