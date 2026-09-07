import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "test-results", "store-premium");
const label = process.argv[2] || "before";
const url = process.argv[3] || "http://127.0.0.1:3000/magaza";

const html = await fetch(url).then((response) => response.text());
const names = [...html.matchAll(/store-card-name[^>]*>([^<]+)/g)].map((match) =>
  match[1].trim(),
);
const slugs = [
  ...new Set(
    [...html.matchAll(/href="\/urun\/([^"]+)"/g)].map((match) => match[1]),
  ),
];
const prices = [...html.matchAll(/₺[\d.,]+/g)].map((match) => match[0]);
const fingerprint = {
  capturedAt: new Date().toISOString(),
  url,
  cardCount: names.length,
  names,
  slugs,
  prices: [...new Set(prices)],
  heading: html.includes("3D BASKI KOLEKSİYONU"),
  emptyState:
    html.includes("yayınlanan ürün bulunamadı") ||
    html.includes("Yeni ürünler hazırlanıyor."),
};

mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, `fingerprint-${label}.json`),
  `${JSON.stringify(fingerprint, null, 2)}\n`,
);
console.log(
  JSON.stringify(
    {
      label,
      cardCount: names.length,
      slugCount: slugs.length,
      first: names[0] ?? null,
      last: names.at(-1) ?? null,
    },
    null,
    2,
  ),
);
