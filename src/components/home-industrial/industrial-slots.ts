export const industrialAssets = {
  heroWireframeVase: "/images/home-industrial/hero-wireframe-vase.png",
  pathIdeaDragon: "/images/home-industrial/path-idea-dragon.png",
  pathReadyModel: "/images/home-industrial/path-ready-model.png",
  pathUploadObject: "/images/home-industrial/path-upload-object.png",
  archiveMain: "/images/home-industrial/archive-main.png",
  archiveThumb01: "/images/home-industrial/archive-thumb-01.png",
  archiveThumb02: "/images/home-industrial/archive-thumb-02.png",
  featuredProduct: "/images/home-industrial/featured-product.png",
  productionTunnel: "/images/home-industrial/production-tunnel.png",
  materialPla: "/images/home-industrial/material-pla.png",
  materialPetg: "/images/home-industrial/material-petg.png",
  materialTpu: "/images/home-industrial/material-tpu.png",
  printerFarm: "/images/home-industrial/printer-farm.png",
} as const;

export const RESIN_SPECIMEN_SRC = "/images/home-industrial/material-resin.png";

export type IndustrialAssetPath =
  (typeof industrialAssets)[keyof typeof industrialAssets];

export const industrialAssetPaths = Object.values(industrialAssets);

export const industrialMaterialSrc = {
  pla: industrialAssets.materialPla,
  petg: industrialAssets.materialPetg,
  tpu: industrialAssets.materialTpu,
} as const;

/** Temporary stand-ins until GPT stills land in /images/home-atelier/. */
export const atelierMedia = {
  startUpload: industrialAssets.heroWireframeVase,
  startReady: industrialAssets.pathReadyModel,
  startShop: industrialAssets.featuredProduct,
  startWholesale: industrialAssets.pathUploadObject,
  stepHero: industrialAssets.featuredProduct,
  stepPrinter: industrialAssets.printerFarm,
  packBox: industrialAssets.pathUploadObject,
  detailFilament: industrialAssets.materialPla,
  detailNozzle: industrialAssets.productionTunnel,
  personal: industrialAssets.featuredProduct,
  corporate: industrialAssets.archiveMain,
} as const;

export const ATELIER_GPT_FILES = [
  "public/images/hero/octo-sand-field.webp",
  "public/images/home-atelier/cave-sand-bg.webp",
  "public/images/home-atelier/start-upload.webp",
  "public/images/home-atelier/start-ready.webp",
  "public/images/home-atelier/start-shop.webp",
  "public/images/home-atelier/start-wholesale.webp",
  "public/images/home-atelier/step-hero.webp",
  "public/images/home-atelier/step-printer.webp",
  "public/images/home-atelier/step-pack.webp",
  "public/images/home-atelier/select-hero.webp",
  "public/images/home-atelier/detail-filament.webp",
  "public/images/home-atelier/detail-nozzle.webp",
  "public/images/home-atelier/split-personal.webp",
  "public/images/home-atelier/split-corporate.webp",
] as const;
