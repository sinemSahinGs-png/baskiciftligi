import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "public", "icon.png");
const iconsDir = path.join(root, "public", "icons");

function pngToIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + 16 * count;
  const sizes = pngBuffers.map((buffer) => buffer.length);
  const offsets = [];
  let offset = headerSize;
  for (const size of sizes) {
    offsets.push(offset);
    offset += size;
  }
  const ico = Buffer.alloc(offset);
  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(count, 4);
  let dir = 6;
  for (let index = 0; index < count; index += 1) {
    const png = pngBuffers[index];
    const meta = sharp(png);
    void meta;
    const dimension = [16, 32, 48][index] ?? 32;
    ico.writeUInt8(dimension >= 256 ? 0 : dimension, dir);
    ico.writeUInt8(dimension >= 256 ? 0 : dimension, dir + 1);
    ico.writeUInt8(0, dir + 2);
    ico.writeUInt8(0, dir + 3);
    ico.writeUInt16LE(1, dir + 4);
    ico.writeUInt16LE(32, dir + 6);
    ico.writeUInt32LE(png.length, dir + 8);
    ico.writeUInt32LE(offsets[index], dir + 12);
    png.copy(ico, offsets[index]);
    dir += 16;
  }
  return ico;
}

async function pngAt(size, { padded = false } = {}) {
  if (!padded) {
    return sharp(source)
      .resize(size, size, { fit: "cover", withoutEnlargement: false })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }
  const inner = Math.round(size * 0.8);
  const mark = await sharp(source)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

await mkdir(iconsDir, { recursive: true });
await mkdir(posterDir, { recursive: true });

const sizes = [16, 32, 48, 180, 192, 512];
const files = {};
for (const size of sizes) {
  const buffer = await pngAt(size);
  const dest = path.join(iconsDir, `icon-${size}.png`);
  await writeFile(dest, buffer);
  files[size] = dest;
}

const maskable = await pngAt(512, { padded: true });
await writeFile(path.join(iconsDir, "icon-512-maskable.png"), maskable);

const ico = pngToIco([
  await pngAt(16),
  await pngAt(32),
  await pngAt(48),
]);
await writeFile(path.join(root, "src", "app", "favicon.ico"), ico);
await writeFile(path.join(root, "public", "favicon.ico"), ico);
await writeFile(path.join(root, "src", "app", "icon.png"), await pngAt(32));
await writeFile(path.join(root, "src", "app", "apple-icon.png"), await pngAt(180));

const png512 = await readFile(path.join(iconsDir, "icon-512.png"));
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" role="img" aria-labelledby="title">
  <title id="title">Baskı Çiftliği</title>
  <image width="512" height="512" href="data:image/png;base64,${png512.toString("base64")}"/>
</svg>
`;
await writeFile(path.join(root, "public", "icon.svg"), svg);

console.log(
  JSON.stringify(
    {
      source,
      faviconBytes: ico.length,
      files: Object.keys(files),
    },
    null,
    2,
  ),
);
