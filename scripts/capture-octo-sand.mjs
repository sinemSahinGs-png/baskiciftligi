import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const base = process.env.OCTO_CAPTURE_URL || "http://127.0.0.1:3000";
const out = path.join("qa-octo-sand");
mkdirSync(out, { recursive: true });

const proof = { captureUrl: base, routes: {}, overflowX: {}, videos: {}, headers: {}, errors: [] };

const browser = await chromium.launch();

async function capture(width, height, suffix, reduced = false) {
  const page = await browser.newPage({
    viewport: { width, height },
    locale: "tr-TR",
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  page.on("pageerror", (err) => proof.errors.push(String(err)));
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, `octo-sand-hero-start-${suffix}.png`), animations: "disabled" });
  const stats = await page.evaluate(() => ({
    overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    headers: document.querySelectorAll("header").length,
    videos: document.querySelectorAll("video").length,
    src: document.querySelector("video")?.currentSrc ?? "",
    paused: document.querySelector("video")?.paused ?? null,
    readyState: document.querySelector("video")?.readyState ?? null,
    canvas: document.querySelector("[data-octo-sand-canvas]")?.getBoundingClientRect(),
    mode: document.querySelector("[data-octo-sand-mode]")?.getAttribute("data-octo-sand-mode"),
  }));
  proof.overflowX[suffix] = stats.overflow;
  proof.headers[suffix] = stats.headers;
  proof.videos[suffix] = stats;
  if (!reduced) {
    await page.mouse.move(200, 360);
    for (let i = 0; i < 18; i += 1) {
      await page.mouse.move(200 + i * 12, 360 + Math.sin(i) * 30);
    }
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(out, `octo-sand-hero-brush-${suffix}.png`), animations: "disabled" });
    const reset = page.getByRole("button", { name: "Kumu sıfırla" });
    if (await reset.count()) {
      await reset.click({ force: true });
      await page.waitForTimeout(1700);
      await page.screenshot({ path: path.join(out, `octo-sand-hero-reset-${suffix}.png`), animations: "disabled" });
    }
  } else {
    await page.screenshot({ path: path.join(out, `octo-sand-hero-reduced-${suffix}.png`), animations: "disabled" });
  }
  if (suffix === "390" && !reduced) {
    await page.evaluate(() => {
      const button = document.querySelector("[data-testid='octo-open-menu']");
      if (button instanceof HTMLButtonElement) button.click();
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(out, "octo-sand-hero-menu-390.png"), animations: "disabled" });
    await page.keyboard.press("Escape");
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.92));
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(out, "octo-sand-hero-next-390.png"), animations: "disabled" });
    await page.screenshot({ path: path.join(out, "octo-sand-home-full-390.png"), fullPage: true, animations: "disabled" });
  }
  if (suffix === "1440" && !reduced) {
    await page.screenshot({ path: path.join(out, "octo-sand-hero-close-1440.png"), animations: "disabled" });
    await page.screenshot({ path: path.join(out, "octo-sand-home-full-1440.png"), fullPage: true, animations: "disabled" });
  }
  await page.close();
}

await capture(390, 844, "390");
await capture(1440, 900, "1440");
await capture(390, 844, "390", true);
await capture(1440, 900, "1440", true);
writeFileSync(path.join(out, "octo-sand-proof.json"), `${JSON.stringify(proof, null, 2)}\n`);
await browser.close();
console.log("wrote", out, proof);
