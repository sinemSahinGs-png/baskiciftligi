import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const copies = [
  [
    "C:/Users/ATA/OneDrive/Masaüstü/siteler/websites/astra-key/public/videos/orbia-cosmic-desktop.mp4",
    "public/categories/orbia/hero-desktop.mp4",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/siteler/websites/astra-key/public/videos/orbia-cosmic-mobile.mp4",
    "public/categories/orbia/hero-mobile.mp4",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/siteler/websites/astra-key/public/videos/orbia-cosmic-poster.webp",
    "public/categories/orbia/poster.webp",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/siteler/websites/astra-key/public/images/brand/orbia-mark.svg",
    "public/categories/orbia/logo.svg",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/siteler/websites/astra-key/public/images/products/orbia-keychain.webp",
    "public/categories/orbia/product.webp",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/memoora/public/videos/memoora-hero-scrub.mp4",
    "public/categories/memoora/hero.mp4",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/memoora/public/assets/tree-hero.png",
    "public/categories/memoora/poster.png",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/memoora/public/images/memoora/branding/memoora-tree-icon.svg",
    "public/categories/memoora/logo.svg",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/memoora/public/images/memoora/products/memoora-leaf-magnet.png",
    "public/categories/memoora/magnet.png",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/memoora/public/images/memoora/products/memoora-leaf-keychain.png",
    "public/categories/memoora/keychain.png",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/siteler/websites/memory-card-mini-album/public/videos/hero.mp4",
    "public/categories/cep-album/hero.mp4",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/siteler/websites/memory-card-mini-album/public/images/hero-poster.webp",
    "public/categories/cep-album/poster.webp",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/siteler/websites/memory-card-mini-album/public/images/products/hero-mini-album.webp",
    "public/categories/cep-album/product-hero.webp",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/siteler/websites/memory-card-mini-album/public/images/album-previews/preview-90lar.webp",
    "public/categories/cep-album/preview-90lar.webp",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/siteler/websites/memory-card-mini-album/public/images/album-previews/preview-rap.webp",
    "public/categories/cep-album/preview-rap.webp",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/siteler/websites/memory-card-mini-album/public/images/album-previews/preview-rock.webp",
    "public/categories/cep-album/preview-rock.webp",
  ],
  [
    "C:/Users/ATA/OneDrive/Masaüstü/siteler/websites/memory-card-mini-album/public/images/album-previews/preview-arabesk.webp",
    "public/categories/cep-album/preview-arabesk.webp",
  ],
];

for (const [from, to] of copies) {
  const dest = path.join(root, to);
  mkdirSync(path.dirname(dest), { recursive: true });
  if (!existsSync(from)) {
    console.error("missing source", from);
    process.exitCode = 1;
    continue;
  }
  copyFileSync(from, dest);
  console.log("copied", to);
}
