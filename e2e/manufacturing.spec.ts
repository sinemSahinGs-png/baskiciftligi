import { expect, test, type Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

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
  await expect(page.getByRole("button", { name: "Tel kafes" })).toBeVisible();
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

async function goToSummary(page: Page) {
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "7. Özet" })
    .locator("visible=true")
    .last()
    .click();
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
    await goToSummary(page);
    await expect(
      page.getByRole("button", { name: "Analiz ve dilimlemeyi başlat" }),
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
      page.getByText("Bu dosya geçerli bir STL, OBJ veya 3MF değil."),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Model okunuyor")).toHaveCount(0);
  });

  test("analysis without a worker never invents a quote", async ({ page }) => {
    test.setTimeout(45_000);
    test.skip(await workerHealthy(), "worker is online; offline path is covered when down");
    mkdirSync(shotDir, { recursive: true });
    await page.goto("/model-yukle");
    await selectFixture(page, cube);
    await goToSummary(page);
    await page.getByRole("button", { name: "Analiz ve dilimlemeyi başlat" }).click();
    await expect(
      page.getByText(/Dilimleme işçisi çevrimdışı|Docker Compose|zaman aşımı/i),
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
    await expect(page.getByRole("button", { name: "Sığdır" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Sıfırla" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tel kafes" })).toBeVisible();
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
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.w, height: viewport.h });
      await page.goto(`/model-yukle?vp=${viewport.w}`);
      await selectFixture(page, cube);
      await expect(page.getByText("20mm-cube.stl").first()).toBeVisible({
        timeout: 15_000,
      });
      if (viewport.w === 375) {
        await goToSummary(page);
        await expect(page.getByText("Görüntüleyici").first()).toBeVisible();
        await expect(page.getByRole("button", { name: "Tel kafes" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Sığdır" })).toBeVisible();
        await expect(page.getByRole("button", { name: "Sıfırla" })).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Analiz ve dilimlemeyi başlat" }),
        ).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        );
        expect(overflow, "375×812 must not overflow horizontally").toBe(false);
        const viewer = page.locator("section").filter({ hasText: "Görüntüleyici" }).first();
        const viewerBox = await viewer.boundingBox();
        expect(viewerBox?.height ?? 0).toBeGreaterThan(120);
        await page.locator("canvas").first().hover();
        await page.mouse.down();
        await page.mouse.move((viewerBox?.x ?? 0) + 40, (viewerBox?.y ?? 0) + 40);
        await page.mouse.up();
      }
      await page.screenshot({
        path: path.join(shotDir, `preview-${viewport.w}x${viewport.h}.png`),
        fullPage: true,
      });
    }
  });

  test("live worker quote can be added to the cart", async ({ page }) => {
    test.setTimeout(8 * 60_000);
    const online = await workerHealthy();
    test.skip(!online, "slicer-worker /health is down; live slice is not claimed");
    mkdirSync(shotDir, { recursive: true });
    await page.goto("/model-yukle");
    await selectFixture(page, cube);
    await goToSummary(page);
    const quoteResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/manufacturing/quotes/") &&
        response.request().method() === "GET" &&
        response.ok(),
    );
    await page.getByRole("button", { name: "Analiz ve dilimlemeyi başlat" }).click();
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
    await page.getByRole("tab", { name: "Thingiverse" }).click();
    await expect(
      page.getByRole("heading", { name: "Thingiverse keşfi" }),
    ).toBeVisible();
    await expect(
      page.getByText(/yapılandırılmadı|Kimlik bilgileri|Bağlı|sorgulanıyor/i).first(),
    ).toBeVisible();
  });
});
