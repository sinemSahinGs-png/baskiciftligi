import { expect, test, type Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { cleanupManufacturingRecords, writeUniqueBoxStl, writeUniqueOverhangStl } from "./manufacturing-fixtures";

const cube = path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.stl");
const cubeObj = path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.obj");
const cube3mf = path.join(process.cwd(), "fixtures", "meshes", "20mm-cube.3mf");
const shotDir = path.join(process.cwd(), "test-results", "manufacturing-acceptance");

function readEnvLocal(key: string): string | null {
  try {
    const text = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    const line = text.split(/\r?\n/).find((entry) => entry.startsWith(`${key}=`));
    return line ? line.slice(key.length + 1).trim() : null;
  } catch {
    return null;
  }
}

async function workerHealthy() {
  try {
    const response = await fetch("http://127.0.0.1:8788/health", {
      signal: AbortSignal.timeout(1500),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForConfigurator(page: Page) {
  await expect(page.getByTestId("configurator-shell")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("mesh-viewer")).toBeVisible();
}

async function ensureInspectorOpen(page: Page) {
  const expand = page.getByRole("button", { name: "Genişlet" });
  if (await expand.isVisible().catch(() => false)) {
    const drawer = page.getByTestId("config-drawer");
    if ((await drawer.getAttribute("data-expanded")) !== "true") {
      await expand.click();
      await expect(drawer).toHaveAttribute("data-expanded", "true");
    }
  }
}

async function goToAnalysis(page: Page) {
  await ensureInspectorOpen(page);
  await page.getByRole("button", { name: "Model" }).click();
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Analiz et", exact: true }).click();
  await ensureInspectorOpen(page);
  await expect(page.getByRole("heading", { name: "Analiz" })).toBeVisible();
}

async function selectFixture(
  page: Page,
  filePath:
    | string
    | { name: string; mimeType: string; buffer: Buffer },
) {
  await waitForConfigurator(page);
  const input = page.locator("#model-file").first();
  await input.setInputFiles(filePath);
  const label =
    typeof filePath === "string" ? path.basename(filePath) : filePath.name;
  const named = page.getByText(label).first();
  if (!(await named.isVisible().catch(() => false))) {
    await input.setInputFiles(filePath);
  }
  await expect(named).toBeVisible({ timeout: 20_000 });
}

async function startSlicing(page: Page) {
  const start = page
    .getByRole("button", { name: "Analiz et ve fiyatı hesapla" })
    .locator("visible=true")
    .first();
  await expect(start).toBeEnabled({ timeout: 10_000 });
  await start.click();
}

test.describe("manufacturing quotation", () => {
  test("uploaded STL shows a real preview and no price before slicing", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    mkdirSync(shotDir, { recursive: true });
    await page.goto("/model-yukle");
    await page.screenshot({
      path: path.join(shotDir, "empty-1920.png"),
      fullPage: true,
    });
    await selectFixture(page, cube);
    await expect(page.getByText("20mm-cube.stl").first()).toBeVisible();
    await expect(page.getByText(/X 20\.0|X 19\./).first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      page.getByText(/Fiyat, dilimleme bitince görünür/).first(),
    ).toBeVisible();
    await page.screenshot({
      path: path.join(shotDir, "preview-stl-1920.png"),
      fullPage: true,
    });
    await goToAnalysis(page);
    await expect(
      page.getByRole("button", { name: "Analiz et ve fiyatı hesapla" }).first(),
    ).toBeVisible();
    await expect(page.getByText(/KDV dahil/)).toHaveCount(0);
    await page.screenshot({
      path: path.join(shotDir, "options-summary-1920.png"),
      fullPage: true,
    });
  });

  test("OBJ and 3MF fixtures preview without a fake placeholder", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/model-yukle");
    await selectFixture(page, cubeObj);
    await expect(page.getByText("20mm-cube.obj").first()).toBeVisible();
    await expect(page.getByText(/X 20\.0|X 19\./).first()).toBeVisible({
      timeout: 20_000,
    });
    await page.goto("/model-yukle?format=3mf");
    await selectFixture(page, cube3mf);
    await expect(page.getByText("20mm-cube.3mf").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/X 20\.0|X 19\./).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("invalid STL shows an error, not an endless loader", async ({ page }) => {
    await page.goto("/model-yukle");
    await selectFixture(page, {
      name: "trick.stl",
      mimeType: "model/stl",
      buffer: Buffer.from("<!DOCTYPE html><html><body>nope</body></html>"),
    });
    await expect(
      page.getByText("Bu dosya geçerli bir STL, OBJ veya 3MF değil.").first(),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Model okunuyor")).toHaveCount(0);
  });

  test("analysis without a worker never invents a quote", async ({ page }) => {
    test.setTimeout(45_000);
    test.skip(await workerHealthy(), "worker is online; offline path is covered when down");
    mkdirSync(shotDir, { recursive: true });
    await page.goto("/model-yukle");
    await selectFixture(page, cube);
    await goToAnalysis(page);
    await startSlicing(page);
    await expect(
      page.getByText(/Fiyat analizi şu anda tamamlanamıyor|Analiz zaman aşımına uğradı/i),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/KDV dahil/)).toHaveCount(0);
    await page.screenshot({
      path: path.join(shotDir, "worker-error-1920.png"),
      fullPage: true,
    });
  });

  test("reduced-motion upload remains usable", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/model-yukle");
    await selectFixture(page, cube);
    await expect(page.getByRole("button", { name: "Sığdır" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Sıfırla" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Tel kafes" }).first()).toBeVisible();
  });

  test("preview viewports keep controls readable", async ({ page }) => {
    test.setTimeout(90_000);
    mkdirSync(shotDir, { recursive: true });
    const viewports = [
      { w: 375, h: 812 },
      { w: 430, h: 932 },
      { w: 768, h: 1024 },
      { w: 1024, h: 768 },
      { w: 1440, h: 1000 },
      { w: 1920, h: 1080 },
    ];
    const drawerMetrics: Array<Record<string, number | string>> = [];
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.w, height: viewport.h });
      await page.goto(`/model-yukle?vp=${viewport.w}`);
      await selectFixture(page, cube);
      await expect(page.getByText("20mm-cube.stl").first()).toBeVisible({
        timeout: 15_000,
      });
      if (viewport.w === 375 || viewport.w === 430) {
        await expect(page.getByTestId("config-drawer")).toHaveAttribute(
          "data-expanded",
          "false",
        );
        const shell = page.getByTestId("configurator-shell");
        const viewer = page.getByTestId("mesh-viewer");
        const canvas = page.locator("canvas").first();
        const shellBox = await shell.boundingBox();
        const viewerBox = await viewer.boundingBox();
        const canvasBox = await canvas.boundingBox();
        expect(viewerBox?.height ?? 0).toBeGreaterThan(120);
        expect(canvasBox?.height ?? 0).toBeGreaterThan(80);
        const ratio =
          (viewerBox?.height ?? 0) / Math.max(1, shellBox?.height ?? 1);
        expect(ratio, `${viewport.w}×${viewport.h} collapsed viewer ratio`).toBeGreaterThanOrEqual(
          0.38,
        );
        await expect(page.getByText("Görüntüleyici").first()).toBeVisible();
        await expect(page.getByRole("button", { name: "Tel kafes" }).first()).toBeVisible();
        await expect(page.getByRole("button", { name: "Sığdır" }).first()).toBeVisible();
        await expect(page.getByRole("button", { name: "Sıfırla" }).first()).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Analiz et ve fiyatı hesapla" }).first(),
        ).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        );
        expect(overflow, `${viewport.w}×${viewport.h} must not overflow horizontally`).toBe(false);
        await canvas.hover();
        await page.mouse.down();
        await page.mouse.move((canvasBox?.x ?? 0) + 40, (canvasBox?.y ?? 0) + 40);
        await page.mouse.up();
        await page.screenshot({
          path: path.join(shotDir, `preview-${viewport.w}x${viewport.h}-collapsed.png`),
          fullPage: true,
        });
        await ensureInspectorOpen(page);
        await page.getByRole("button", { name: "Model" }).click();
        await page.getByRole("checkbox").first().check();
        await page.getByRole("button", { name: "Analiz", exact: true }).click();
        await expect(page.getByTestId("config-drawer")).toHaveAttribute(
          "data-expanded",
          "true",
        );
        await expect(page.getByRole("heading", { name: "Analiz" })).toBeVisible();
        const expandedViewer = await viewer.boundingBox();
        const expandedShell = await shell.boundingBox();
        const expandedRatio =
          (expandedViewer?.height ?? 0) / Math.max(1, expandedShell?.height ?? 1);
        expect(expandedRatio).toBeGreaterThanOrEqual(0.32);
        drawerMetrics.push({
          viewport: `${viewport.w}x${viewport.h}`,
          shellHeight: Math.round(shellBox?.height ?? 0),
          collapsedViewerHeight: Math.round(viewerBox?.height ?? 0),
          collapsedCanvasHeight: Math.round(canvasBox?.height ?? 0),
          collapsedViewerRatio: Number(ratio.toFixed(3)),
          expandedViewerHeight: Math.round(expandedViewer?.height ?? 0),
          expandedViewerRatio: Number(expandedRatio.toFixed(3)),
        });
        await page.screenshot({
          path: path.join(shotDir, `preview-${viewport.w}x${viewport.h}-expanded.png`),
          fullPage: true,
        });
        await page.getByRole("button", { name: "Küçült" }).click();
      }
      await page.screenshot({
        path: path.join(shotDir, `preview-${viewport.w}x${viewport.h}.png`),
        fullPage: true,
      });
    }
    if (drawerMetrics.length > 0) {
      writeFileSync(
        path.join(shotDir, "drawer-metrics.json"),
        `${JSON.stringify(drawerMetrics, null, 2)}\n`,
        "utf8",
      );
    }
  });

  test("live worker quote can be added to the cart", async ({ page }) => {
    test.setTimeout(8 * 60_000);
    const online = await workerHealthy();
    test.skip(!online, "slicer-worker /health is down; live slice is not claimed");
    mkdirSync(shotDir, { recursive: true });
    await page.goto("/model-yukle");
    await selectFixture(page, cube);
    await goToAnalysis(page);
    const quoteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/manufacturing/quotes/") &&
        response.request().method() === "GET" &&
        response.ok(),
    );
    await startSlicing(page);
    await page.screenshot({
      path: path.join(shotDir, "slicing-1920.png"),
      fullPage: true,
    });
    await expect(page.getByText(/KDV dahil/).first()).toBeVisible({
      timeout: 7 * 60_000,
    });
    const quoteResponse = await quoteResponsePromise;
    const quoteJson = (await quoteResponse.json()) as {
      id: string;
      jobId: string;
      breakdown: {
        grossMinor: number;
        netMinor: number;
        vatMinor: number;
        materialMinor: number;
        productionDurationSeconds: number;
      };
      metrics: {
        filamentWeightGrams: number;
        filamentLengthMm?: number;
        layerCount: number | null;
        estimatedDurationSeconds: number;
        dimensionsMm: { x: number; y: number; z: number };
        engine?: { version?: string };
      };
      configuration: {
        materialId: string;
        qualityId: string;
        infillPercent: number;
        quantity: number;
      };
    };
    expect(quoteJson.metrics.filamentWeightGrams).toBeGreaterThan(0);
    expect(quoteJson.breakdown.grossMinor).toBeGreaterThan(0);
    writeFileSync(
      path.join(shotDir, "live-quote.json"),
      `${JSON.stringify(quoteJson, null, 2)}\n`,
      "utf8",
    );
    await page.screenshot({
      path: path.join(shotDir, "quote-1920.png"),
      fullPage: true,
    });
    await page
      .locator("div")
      .filter({ hasText: "KDV dahil" })
      .filter({ hasText: "Net" })
      .first()
      .screenshot({ path: path.join(shotDir, "quote-breakdown-1920.png") });

    const quoteId = quoteJson.id;
    const priceTamper = await page.request.post(
      `/api/manufacturing/quotes/${quoteId}/cart`,
      { data: { unitPrice: 1 } },
    );
    expect(priceTamper.status()).toBe(409);
    const qtyTamper = await page.request.post(
      `/api/manufacturing/quotes/${quoteId}/cart`,
      { data: { quantity: 9 } },
    );
    expect(qtyTamper.status()).toBe(409);
    const materialTamper = await page.request.post(
      `/api/manufacturing/quotes/${quoteId}/cart`,
      { data: { materialId: "petg" } },
    );
    expect(materialTamper.status()).toBe(409);
    const qualityTamper = await page.request.post(
      `/api/manufacturing/quotes/${quoteId}/cart`,
      { data: { qualityId: "ekonomik" } },
    );
    expect(qualityTamper.status()).toBe(409);

    spawnSync("docker", ["compose", "stop", "slicer-worker"], {
      stdio: "ignore",
      timeout: 30_000,
    });
    try {
    const storePath = path.join(process.cwd(), ".octo-data", "manufacturing", "store.json");
    const store = JSON.parse(readFileSync(storePath, "utf8")) as {
      quotes: Array<{
        id: string;
        signature: string;
        expiresAt: string;
        jobId: string;
      }>;
    };
    const stored = store.quotes.find((item) => item.id === quoteId);
    expect(stored, "quoted job must persist locally").toBeTruthy();
    const originalSignature = stored!.signature;
    const originalExpiry = stored!.expiresAt;
    stored!.signature = `${originalSignature.slice(0, -4)}dead`;
    writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
    const signatureTamper = await page.request.post(
      `/api/manufacturing/quotes/${quoteId}/cart`,
    );
    expect(signatureTamper.status()).toBe(409);
    stored!.signature = originalSignature;
    stored!.expiresAt = "2020-01-01T00:00:00.000Z";
    writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
    const expiredTamper = await page.request.post(
      `/api/manufacturing/quotes/${quoteId}/cart`,
    );
    expect(expiredTamper.status()).toBe(409);
    stored!.expiresAt = originalExpiry;
    writeFileSync(storePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");

    const workerSecret = readEnvLocal("SLICER_WORKER_SECRET");
    expect(workerSecret, "SLICER_WORKER_SECRET must exist for duplicate-job check").toBeTruthy();
    const duplicate = await page.request.post(
      `/api/internal/slicer/jobs/${quoteJson.jobId}/result`,
      {
        headers: { Authorization: `Bearer ${workerSecret}` },
        data: {
          ok: true,
          metrics: {
            dimensionsMm: quoteJson.metrics.dimensionsMm,
            filamentLengthMm: 1,
            filamentWeightGrams: quoteJson.metrics.filamentWeightGrams,
            estimatedDurationSeconds: quoteJson.metrics.estimatedDurationSeconds,
            layerCount: quoteJson.metrics.layerCount,
            supportUsed: false,
            materialId: "pla",
            qualityId: "standart",
            quantity: 1,
            orientation: { rotateX: 0, rotateY: 0, rotateZ: 0 },
            engine: { name: "PrusaSlicer", version: "tamper-duplicate" },
            profileChecksum: "0".repeat(64),
            warnings: [],
          },
        },
      },
    );
    expect(duplicate.ok()).toBeTruthy();
    const duplicateBody = (await duplicate.json()) as {
      idempotent?: boolean;
      quoteId?: string;
    };
    expect(duplicateBody.idempotent).toBe(true);
    expect(duplicateBody.quoteId).toBe(quoteId);
    const afterDuplicate = await page.request.get(`/api/manufacturing/quotes/${quoteId}`);
    const afterJson = (await afterDuplicate.json()) as {
      breakdown: { grossMinor: number };
      metrics: { engine?: { version?: string } };
    };
    expect(afterJson.breakdown.grossMinor).toBe(quoteJson.breakdown.grossMinor);
    expect(afterJson.metrics.engine?.version).not.toBe("tamper-duplicate");

    writeFileSync(
      path.join(shotDir, "tamper-results.json"),
      `${JSON.stringify(
        {
          clientPrice: priceTamper.status(),
          quantity: qtyTamper.status(),
          material: materialTamper.status(),
          quality: qualityTamper.status(),
          signature: signatureTamper.status(),
          expired: expiredTamper.status(),
          duplicateJob: {
            status: duplicate.status(),
            idempotent: duplicateBody.idempotent,
          },
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    } finally {
      spawnSync("docker", ["compose", "start", "slicer-worker"], {
        stdio: "ignore",
        timeout: 30_000,
      });
    }

    await page.getByRole("button", { name: "Teklifi sepete ekle" }).click();
    await expect(page).toHaveURL(/sepet/);
    await expect(page.getByText("Yüklenen model")).toBeVisible();
    await expect(page.getByText(/KDV dahil|Toplam/i).first()).toBeVisible();
    await page.screenshot({
      path: path.join(shotDir, "cart-1920.png"),
      fullPage: true,
    });
  });

  test("Thingiverse tab is honest when unconfigured", async ({ page }) => {
    await page.goto("/hazir-modeller");
    await expect(page.getByRole("heading", { name: "Ne üretmek istiyorsun?" })).toBeVisible({
      timeout: 15_000,
    });
    const community = page.getByRole("button", { name: "Topluluk" });
    if (await community.isVisible().catch(() => false)) {
      await community.click();
      await expect(
        page.getByText(/yapılandırılmadı|Kimlik bilgileri|Bağlı|sorgulanıyor/i).first(),
      ).toBeVisible();
    } else {
      await expect(community).toHaveCount(0);
    }
  });
});

test.describe.serial("fresh unique mesh slicing", () => {
  const unique = writeUniqueBoxStl(`pw${Date.now().toString(36)}`);
  let freshJobId = "";
  let freshGross = 0;

  test.afterAll(() => {
    cleanupManufacturingRecords(freshJobId);
  });

  test("unique mesh starts a new PrusaSlicer job and quote", async ({ page }) => {
    test.setTimeout(8 * 60_000);
    const online = await workerHealthy();
    test.skip(!online, "slicer-worker /health is down; live slice is not claimed");
    mkdirSync(shotDir, { recursive: true });
    await page.goto("/model-yukle");
    await selectFixture(page, unique.filePath);
    await expect(page.getByText(/X 20\.|Y 20\.|Z 20\./).first()).toBeVisible({
      timeout: 20_000,
    });
    await goToAnalysis(page);
    const uploadPromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/manufacturing/uploads") &&
        response.request().method() === "POST" &&
        response.ok(),
    );
    const quotePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/manufacturing/quotes/") &&
        response.request().method() === "GET" &&
        response.ok(),
    );
    await startSlicing(page);
    const upload = await uploadPromise;
    const uploaded = (await upload.json()) as { jobId: string; existing?: boolean };
    expect(uploaded.existing).not.toBe(true);
    freshJobId = uploaded.jobId;
    await expect(page.getByText(/KDV dahil/).first()).toBeVisible({
      timeout: 7 * 60_000,
    });
    const quoteResponse = await quotePromise;
    const quoteJson = (await quoteResponse.json()) as {
      id: string;
      jobId: string;
      breakdown: { grossMinor: number };
      metrics: {
        filamentWeightGrams: number;
        layerCount: number | null;
        estimatedDurationSeconds: number;
        dimensionsMm: { x: number; y: number; z: number };
        supportUsed: boolean;
        supportGenerated?: boolean;
        supportMaterialGrams?: number | null;
        supportLayerCount?: number | null;
        gcodeParserVersion?: string;
      };
      internal: unknown;
    };
    expect(quoteJson.jobId).toBe(freshJobId);
    expect(quoteJson.metrics.filamentWeightGrams).toBeGreaterThan(0);
    expect(quoteJson.metrics.estimatedDurationSeconds).toBeGreaterThan(0);
    expect(quoteJson.metrics.supportUsed).toBe(false);
    expect(quoteJson.metrics.supportGenerated).toBe(false);
    expect(quoteJson.metrics.supportMaterialGrams ?? 0).toBe(0);
    expect(JSON.stringify(quoteJson)).not.toContain("targetMarginRate");
    expect(JSON.stringify(quoteJson)).not.toContain("riskRate");
    expect(quoteJson.breakdown.grossMinor).toBeGreaterThan(0);
    const storeAfterQuote = JSON.parse(
      readFileSync(path.join(process.cwd(), ".octo-data", "manufacturing", "store.json"), "utf8"),
    ) as {
      quotes: Array<{
        id: string;
        pricingVersion: number;
        pricingChecksum: string;
        internalBreakdown: { supportFeeMinor: number };
        metrics: { gcodeParserVersion?: string; supportGenerated?: boolean };
      }>;
    };
    const storedCube = storeAfterQuote.quotes.find((item) => item.id === quoteJson.id);
    expect(storedCube?.pricingVersion).toBe(2);
    expect(storedCube?.internalBreakdown.supportFeeMinor).toBe(0);
    expect(storedCube?.metrics.supportGenerated).toBe(false);
    expect(storedCube?.metrics.gcodeParserVersion).toBe("bc-gcode-support-v1");
    freshGross = quoteJson.breakdown.grossMinor;
    writeFileSync(
      path.join(shotDir, "fresh-quote.json"),
      `${JSON.stringify(quoteJson, null, 2)}\n`,
      "utf8",
    );
    const cartPricePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/cart/price") &&
        response.request().method() === "POST" &&
        response.ok(),
    );
    await page.getByRole("button", { name: "Teklifi sepete ekle" }).click();
    await expect(page).toHaveURL(/sepet/);
    const cart = (await (await cartPricePromise).json()) as {
      subtotalMinor: number;
      estimatedShippingMinor: number;
      totalMinor: number;
      lines: Array<{ quoteId?: string; lineTotalMinor: number }>;
    };
    expect(cart.lines.some((line) => line.quoteId === quoteJson.id)).toBe(true);
    expect(cart.subtotalMinor).toBe(freshGross);
    expect(cart.estimatedShippingMinor).toBe(8_990);
    expect(cart.totalMinor).toBe(freshGross + 8_990);
    await page.screenshot({
      path: path.join(shotDir, "fresh-cart-1920.png"),
      fullPage: true,
    });
  });

  test("re-uploading the same unique mesh reuses the completed job", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const online = await workerHealthy();
    test.skip(!online, "slicer-worker /health is down; live slice is not claimed");
    expect(freshJobId).toBeTruthy();
    await page.goto("/model-yukle");
    await selectFixture(page, unique.filePath);
    await goToAnalysis(page);
    const uploadPromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/manufacturing/uploads") &&
        response.request().method() === "POST" &&
        response.ok(),
    );
    await startSlicing(page);
    const uploaded = (await (await uploadPromise).json()) as {
      jobId: string;
      existing?: boolean;
    };
    expect(uploaded.existing).toBe(true);
    expect(uploaded.jobId).toBe(freshJobId);
    await expect(page.getByText(/KDV dahil/).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});

test.describe.serial("support-required overhang slicing", () => {
  const unique = writeUniqueOverhangStl(`pw${Date.now().toString(36)}`);
  let overhangJobId = "";

  test.afterAll(() => {
    cleanupManufacturingRecords(overhangJobId);
  });

  test("T-overhang produces support toolpaths and one support-removal labor charge", async ({
    page,
  }) => {
    test.setTimeout(8 * 60_000);
    const online = await workerHealthy();
    test.skip(!online, "slicer-worker /health is down; live slice is not claimed");
    mkdirSync(shotDir, { recursive: true });
    await page.goto("/model-yukle");
    await selectFixture(page, unique.filePath);
    await goToAnalysis(page);
    const uploadPromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/manufacturing/uploads") &&
        response.request().method() === "POST" &&
        response.ok(),
    );
    const quotePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/manufacturing/quotes/") &&
        response.request().method() === "GET" &&
        response.ok(),
    );
    await startSlicing(page);
    const uploaded = (await (await uploadPromise).json()) as { jobId: string; existing?: boolean };
    expect(uploaded.existing).not.toBe(true);
    overhangJobId = uploaded.jobId;
    await expect(page.getByText(/KDV dahil/).first()).toBeVisible({
      timeout: 7 * 60_000,
    });
    const quoteJson = (await (await quotePromise).json()) as {
      id: string;
      jobId: string;
      metrics: {
        supportUsed: boolean;
        supportGenerated?: boolean;
        supportMaterialGrams?: number | null;
        supportLayerCount?: number | null;
      };
      internal: { supportFeeMinor?: number } | null;
    };
    expect(quoteJson.jobId).toBe(overhangJobId);
    expect(quoteJson.metrics.supportGenerated).toBe(true);
    expect(quoteJson.metrics.supportUsed).toBe(true);
    expect(quoteJson.metrics.supportMaterialGrams ?? 0).toBeGreaterThan(0);
    expect(quoteJson.metrics.supportLayerCount ?? 0).toBeGreaterThan(0);
    expect(JSON.stringify(quoteJson)).not.toContain("targetMarginRate");
    const store = JSON.parse(
      readFileSync(path.join(process.cwd(), ".octo-data", "manufacturing", "store.json"), "utf8"),
    ) as {
      quotes: Array<{
        id: string;
        pricingVersion: number;
        internalBreakdown: { supportFeeMinor: number };
        metrics: { gcodeParserVersion?: string; supportGenerated?: boolean };
      }>;
    };
    const stored = store.quotes.find((item) => item.id === quoteJson.id);
    expect(stored?.pricingVersion).toBe(2);
    expect(stored?.internalBreakdown.supportFeeMinor).toBe(1_500);
    expect(stored?.metrics.gcodeParserVersion).toBe("bc-gcode-support-v1");
    writeFileSync(
      path.join(shotDir, "overhang-quote.json"),
      `${JSON.stringify(quoteJson, null, 2)}\n`,
      "utf8",
    );
  });
});

