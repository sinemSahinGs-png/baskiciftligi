import { mkdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const outDir = path.join(process.cwd(), "public", "images", "upload-flow");
const outFile = path.join(outDir, "upload-demo-poster.webp");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <rect width="1600" height="900" fill="#0a1016"/>
  <rect x="0" y="0" width="1600" height="56" fill="#12161c"/>
  <rect x="0" y="56" width="1600" height="2" fill="#ff5a0a"/>
  <text x="24" y="36" fill="#f5f4ef" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16">Görüntüleyici · ornek-akış.stl</text>
  <text x="980" y="36" fill="#d0cec8" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14">Ortala   Görünüme sığdır   Sıfırla</text>
  <rect x="1388" y="14" width="188" height="28" fill="#ff5a0a"/>
  <text x="1482" y="34" text-anchor="middle" fill="#080a0b" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="700">Fiyat</text>

  <rect x="0" y="58" width="56" height="842" fill="#101314"/>
  <g fill="#8adfe0" font-family="ui-sans-serif, system-ui, sans-serif" font-size="9" text-anchor="middle">
    <text x="28" y="110">Seç</text>
    <text x="28" y="170">Döndür</text>
    <text x="28" y="230">Ölçekle</text>
    <text x="28" y="290">Taşı</text>
  </g>

  <rect x="56" y="58" width="1148" height="842" fill="#12161c"/>
  <polygon points="220,720 980,720 860,430 340,430" fill="#2a3038"/>
  <g stroke="#5a6a72" stroke-width="1" opacity="0.55">
    <line x1="280" y1="720" x2="400" y2="430"/>
    <line x1="420" y1="720" x2="500" y2="430"/>
    <line x1="560" y1="720" x2="600" y2="430"/>
    <line x1="700" y1="720" x2="700" y2="430"/>
    <line x1="840" y1="720" x2="800" y2="430"/>
    <line x1="340" y1="500" x2="860" y2="500"/>
    <line x1="280" y1="610" x2="920" y2="610"/>
  </g>
  <polygon points="560,318 740,318 780,470 520,470" fill="#efe8dc"/>
  <polygon points="740,318 800,360 840,512 780,470" fill="#d9d0c2"/>
  <polygon points="520,470 780,470 840,512 560,512" fill="#cfc6b6"/>
  <text x="80" y="820" fill="#c5c8c8" font-family="ui-monospace, monospace" font-size="13">220 × 220 × 250 mm</text>
  <rect x="80" y="80" width="132" height="28" fill="#080a0cd1" stroke="#ff5a0a"/>
  <text x="146" y="99" text-anchor="middle" fill="#f5f4ef" font-family="ui-monospace, monospace" font-size="12" font-weight="700" letter-spacing="2">ÖRNEK AKIŞ</text>

  <rect x="1204" y="58" width="396" height="842" fill="#101314"/>
  <rect x="1204" y="58" width="396" height="48" fill="#0c1014"/>
  <text x="1224" y="88" fill="#9aa0a0" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13">Dosya</text>
  <text x="1294" y="88" fill="#9aa0a0" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13">Üretim</text>
  <rect x="1368" y="70" width="88" height="28" fill="#4054ff"/>
  <text x="1412" y="88" text-anchor="middle" fill="#f5f4ef" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13" font-weight="700">Fiyat</text>
  <text x="1224" y="140" fill="#f5f4ef" font-family="ui-sans-serif, system-ui, sans-serif" font-size="22" font-weight="700">Fiyat</text>
  <text x="1224" y="172" fill="#a5a8a8" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14">Malzeme · PLA  ·  Beyaz</text>
  <rect x="1224" y="196" width="356" height="168" fill="#f0eee8"/>
  <text x="1240" y="228" fill="#080a0b" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="700">Örnek hesaplanmış fiyat</text>
  <text x="1240" y="262" fill="#080a0b" font-family="ui-sans-serif, system-ui, sans-serif" font-size="28" font-weight="700">184,00 TL</text>
  <text x="1240" y="292" fill="#3a3d3d" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14">KDV dahil · 18,40 g · 1 sa 12 dk</text>
  <text x="1240" y="318" fill="#3a3d3d" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13">Canlı fiyat değil. Gerçek tutar yüklemeden sonra çıkar.</text>
  <text x="1224" y="400" fill="#c5c8c8" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14">Yükleme tamamlandı</text>
  <text x="1224" y="428" fill="#30d5d2" font-family="ui-sans-serif, system-ui, sans-serif" font-size="13">ornek-akış.stl · 1.248 üçgen</text>
  <rect x="1224" y="456" width="356" height="44" fill="#ff5a0a"/>
  <text x="1402" y="484" text-anchor="middle" fill="#080a0b" font-family="ui-sans-serif, system-ui, sans-serif" font-size="15" font-weight="700">Analiz et ve fiyatı hesapla</text>
</svg>`;

await mkdir(outDir, { recursive: true });
await sharp(Buffer.from(svg)).webp({ quality: 86 }).toFile(outFile);
console.log(outFile);
