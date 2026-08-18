import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/hesabim/",
          "/api/",
          "/odeme/",
          "/sepet",
          "/favoriler",
          "/model-yukle",
          "/model-yukle/",
          "/giris",
          "/kayit",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
