import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SOURCE = "public/images/hero/octo-tv-sand-shell-source.png";
const OUT_DIR = "public/images/hero";

const SOURCE_WIDTH = 1803;
const SOURCE_HEIGHT = 872;
/** Last fully-black glass pixels from a center walk, then inset 14px to clear the bezel lip. */
const SCREEN = {
  leftPx: 556,
  topPx: 124,
  rightPx: 1236,
  bottomPx: 718,
};

function pct(value, total) {
  return Number((value / total).toFixed(6));
}

const meta = await sharp(SOURCE).metadata();
if (meta.width !== SOURCE_WIDTH || meta.height !== SOURCE_HEIGHT) {
  throw new Error(`Unexpected source size ${meta.width}x${meta.height}`);
}

mkdirSync(OUT_DIR, { recursive: true });

await sharp(SOURCE)
  .webp({ quality: 82, effort: 5 })
  .toFile(path.join(OUT_DIR, "octo-tv-sand-shell-desktop.webp"));

const mobileCrop = {
  left: 428,
  top: 0,
  width: 920,
  height: SOURCE_HEIGHT,
};
await sharp(SOURCE)
  .extract(mobileCrop)
  .webp({ quality: 82, effort: 5 })
  .toFile(path.join(OUT_DIR, "octo-tv-sand-shell-mobile.webp"));

const desktop = {
  left: pct(SCREEN.leftPx, SOURCE_WIDTH),
  top: pct(SCREEN.topPx, SOURCE_HEIGHT),
  width: pct(SCREEN.rightPx - SCREEN.leftPx + 1, SOURCE_WIDTH),
  height: pct(SCREEN.bottomPx - SCREEN.topPx + 1, SOURCE_HEIGHT),
};
const mobile = {
  left: pct(SCREEN.leftPx - mobileCrop.left, mobileCrop.width),
  top: pct(SCREEN.topPx, SOURCE_HEIGHT),
  width: pct(SCREEN.rightPx - SCREEN.leftPx + 1, mobileCrop.width),
  height: pct(SCREEN.bottomPx - SCREEN.topPx + 1, SOURCE_HEIGHT),
};

const desktopMeta = await sharp(path.join(OUT_DIR, "octo-tv-sand-shell-desktop.webp")).metadata();
const mobileMeta = await sharp(path.join(OUT_DIR, "octo-tv-sand-shell-mobile.webp")).metadata();

const report = {
  source: { width: SOURCE_WIDTH, height: SOURCE_HEIGHT, bytes: meta.size ?? null },
  screenPx: SCREEN,
  desktop,
  mobile,
  mobileCanvas: { width: mobileCrop.width, height: SOURCE_HEIGHT, crop: mobileCrop },
  derivatives: {
    desktop: { width: desktopMeta.width, height: desktopMeta.height },
    mobile: { width: mobileMeta.width, height: mobileMeta.height },
  },
};

writeFileSync("qa-octo-sand/octo-tv-screen-measure.json", `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
