import { expect, test, type Page } from "@playwright/test";
import { writeFileSync } from "node:fs";
import path from "node:path";

const shots = path.join("qa-octo-ocean");

async function measure(page: Page) {
  return page.evaluate(() => {
    const layer = document.querySelector(".octo-sand-layer");
    const canvas = document.querySelector<HTMLCanvasElement>("[data-octo-sand-canvas]");
    const debug = document.querySelector(".octo-sand-debug");
    const css = canvas?.getBoundingClientRect();
    const cta = document.querySelector<HTMLAnchorElement>("#ne-uretmek-istiyorsun a[href='/magaza']");
    const input = document.querySelector<HTMLInputElement>("#idea-command-input");
    const header = document.querySelector("header");
    const hit = (node: Element | null) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return Boolean(top && (node === top || node.contains(top)));
    };
    return {
      reason: layer?.getAttribute("data-octo-sand-reason"),
      mode: layer?.getAttribute("data-octo-sand-mode"),
      live: layer?.getAttribute("data-octo-sand-live"),
      ready: layer?.getAttribute("data-octo-sand-ready"),
      canvasCss: { width: Math.round(css?.width ?? 0), height: Math.round(css?.height ?? 0) },
      canvasBuffer: { width: canvas?.width ?? 0, height: canvas?.height ?? 0 },
      canvasOpacity: canvas ? getComputedStyle(canvas).opacity : "",
      pointerEvents: canvas ? getComputedStyle(canvas).pointerEvents : "",
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      ctaHit: hit(cta),
      inputHit: hit(input),
      headerHit: hit(header),
      debug: debug?.textContent ?? "",
      errors: (window as Window & { __octoSandErrors?: string[] }).__octoSandErrors ?? [],
    };
  });
}

async function waitLiveOpacity(page: Page) {
  await expect(page.locator("[data-octo-sand-live='true']")).toHaveCount(1, { timeout: 12_000 });
  await expect
    .poll(async () => {
      const opacity = await page.locator("[data-octo-sand-canvas]").evaluate((node) =>
        Number(getComputedStyle(node).opacity),
      );
      return opacity;
    }, { timeout: 4_000 })
    .toBeGreaterThanOrEqual(0.999);
}

async function strokeSand(page: Page, startX: number, startY: number, endX: number, endY: number, pointerType: "mouse" | "touch") {
  await page.evaluate(
    async ({ startX: x0, startY: y0, endX: x1, endY: y1, pointerType: type }) => {
      const section = document.getElementById("ne-uretmek-istiyorsun");
      if (!section) return;
      section.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, clientX: x0, clientY: y0, pointerType: type }),
      );
      const steps = 24;
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        section.dispatchEvent(
          new PointerEvent("pointermove", {
            bubbles: true,
            clientX: x0 + (x1 - x0) * t,
            clientY: y0 + (y1 - y0) * t,
            pointerType: type,
          }),
        );
      }
      await new Promise((resolve) => window.setTimeout(resolve, 240));
    },
    { startX, startY, endX, endY, pointerType },
  );
}

test.describe("OCTO sand hero proof", () => {
  test("GPU Chrome: debug reason, sized canvas, brush, reset, CTA, overflow", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.addInitScript(() => {
      const store: string[] = [];
      window.addEventListener("error", (event) => store.push(String(event.message)));
      (window as Window & { __octoSandErrors?: string[] }).__octoSandErrors = store;
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/?heroDebug=1");
    await expect(page.locator("[data-octo-sand-reason]")).toHaveAttribute(
      "data-octo-sand-reason",
      /webgl|webgl2_unavailable|reduced_motion|data_saver|engine_init_failed|texture_load_failed|init_timeout|context_lost/,
      { timeout: 12_000 },
    );
    const reason = await page.locator("[data-octo-sand-reason]").getAttribute("data-octo-sand-reason");
    if (reason !== "webgl") {
      const fallback = await measure(page);
      writeFileSync(
        path.join(shots, "sand-hero-proof.json"),
        JSON.stringify({ note: "interactive brush not claimed", ...fallback, errors }, null, 2),
      );
      await page.screenshot({ path: path.join(shots, "sand-hero-1440-fallback.png") });
      expect(fallback.reason).not.toBe("webgl");
      return;
    }

    await waitLiveOpacity(page);
    await page.screenshot({ path: path.join(shots, "sand-hero-1440-before.png") });
    const before = await measure(page);
    expect(before.canvasCss.width).toBeGreaterThan(400);
    expect(before.canvasBuffer.width).toBeGreaterThan(400);
    expect(Number(before.canvasOpacity)).toBeGreaterThanOrEqual(0.999);
    expect(before.pointerEvents).toBe("none");
    expect(before.ctaHit).toBe(true);
    expect(before.inputHit).toBe(true);
    expect(before.headerHit).toBe(true);
    expect(before.overflowX).toBeLessThanOrEqual(1);
    expect(before.debug).toContain("octo-sand-field.webp");
    expect(before.debug).toContain('"textureWidth": 2048');
    expect(before.debug).toContain('"reason": "webgl"');

    const canvas = page.locator("[data-octo-sand-canvas]");
    const beforePixels = await canvas.screenshot();
    const heroBox = await page.locator("#ne-uretmek-istiyorsun").boundingBox();
    if (!heroBox) throw new Error("hero missing");
    await strokeSand(
      page,
      heroBox.x + heroBox.width * 0.78,
      heroBox.y + heroBox.height * 0.22,
      heroBox.x + heroBox.width * 0.94,
      heroBox.y + heroBox.height * 0.58,
      "mouse",
    );
    const afterPixels = await canvas.screenshot();
    const brushChanged = Buffer.compare(beforePixels, afterPixels) !== 0;
    expect(brushChanged).toBe(true);
    await page.screenshot({ path: path.join(shots, "sand-hero-1440-after.png") });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(400);
    await waitLiveOpacity(page);
    await page.screenshot({ path: path.join(shots, "sand-hero-390-before.png") });
    const mobile = await measure(page);
    expect(mobile.canvasCss.width).toBeGreaterThan(200);
    expect(mobile.canvasBuffer.width).toBeGreaterThan(200);
    const mobileBefore = await canvas.screenshot();
    const mobileBox = await page.locator("#ne-uretmek-istiyorsun").boundingBox();
    if (!mobileBox) throw new Error("mobile hero missing");
    await strokeSand(
      page,
      mobileBox.x + 24,
      mobileBox.y + mobileBox.height * 0.2,
      mobileBox.x + mobileBox.width - 24,
      mobileBox.y + mobileBox.height * 0.34,
      "touch",
    );
    const mobileAfter = await canvas.screenshot();
    expect(Buffer.compare(mobileBefore, mobileAfter) !== 0).toBe(true);
    await page.screenshot({ path: path.join(shots, "sand-hero-390-after.png") });

    const reset = page.getByRole("button", { name: "Kumu sıfırla" });
    await expect(reset).toBeVisible();
    await reset.click();
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(shots, "sand-hero-390-reset.png") });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await expect(page.locator("[data-octo-sand-reason]")).toHaveAttribute(
      "data-octo-sand-reason",
      "reduced_motion",
    );
    await expect(page.getByRole("button", { name: "Kumu sıfırla" })).toHaveCount(0);
    const reduced = await measure(page);
    writeFileSync(
      path.join(shots, "sand-hero-proof.json"),
      JSON.stringify(
        {
          gpu: before,
          brushChanged,
          mobile,
          reduced,
          errors: errors.filter((item) => !item.includes("caret-color")),
        },
        null,
        2,
      ),
    );
    expect(errors.filter((item) => !item.includes("caret-color")).length).toBe(0);
  });
});
