#!/usr/bin/env node
/**
 * Builds WebP derivatives from supplied originals.
 * Never overwrites or retouches the original JPEG files.
 */
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const originals = [
  { file: "stand.jpg", out: "stand.webp", width: 1600 },
  { file: "gallery-2.jpg", out: "gallery-2.webp", width: 1200 },
  { file: "gallery-3.jpg", out: "gallery-3.webp", width: 1200 },
];

const root = process.cwd();
const originalDir = path.join(root, "public/images/wholesale/lighters/originals");
const outDir = path.join(root, "public/images/wholesale/lighters");

async function main() {
  mkdirSync(outDir, { recursive: true });
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("sharp yok; WebP üretilemedi.");
    process.exit(1);
  }

  let produced = 0;
  for (const item of originals) {
    const source = path.join(originalDir, item.file);
    if (!existsSync(source)) {
      console.log(`atlandı (orijinal yok): ${item.file}`);
      continue;
    }
    const target = path.join(outDir, item.out);
    await sharp(source)
      .rotate()
      .resize({ width: item.width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(target);
    produced += 1;
    console.log(`yazıldı: ${item.out}`);
  }
  if (produced === 0) {
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "fotoğraf işlenemedi");
  process.exit(1);
});
