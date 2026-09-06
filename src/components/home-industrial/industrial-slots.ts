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

export type IndustrialAssetPath =
  (typeof industrialAssets)[keyof typeof industrialAssets];

export const industrialAssetPaths = Object.values(industrialAssets);

export const industrialMaterialSrc = {
  pla: industrialAssets.materialPla,
  petg: industrialAssets.materialPetg,
  tpu: industrialAssets.materialTpu,
} as const;
