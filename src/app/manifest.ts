import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

const v = siteConfig.brandIconVersion;

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#070909",
    theme_color: "#070909",
    lang: "tr",
    categories: ["shopping", "business", "design"],
    icons: [
      {
        src: `/icons/icon-192.png?v=${v}`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icons/icon-512.png?v=${v}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/icons/icon-512-maskable.png?v=${v}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
