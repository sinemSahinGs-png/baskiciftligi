import type { NextConfig } from "next";

import { STOREFRONT_CATEGORY_REDIRECTS } from "./src/domain/catalog/storefront-taxonomy";

const isDevelopment = process.env.NODE_ENV === "development";
const appCommit =
  process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.BC_GIT_COMMIT ?? "local";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://cdn.thingiverse.com https://resize.thingiverse.com https://www.thingiverse.com",
  "font-src 'self' data:",
  "media-src 'self' blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  isDevelopment ? "" : "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  typedRoutes: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    qualities: [70, 75, 80],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/render/image/public/**",
      },
      {
        protocol: "https",
        hostname: "cdn.thingiverse.com",
      },
      {
        protocol: "https",
        hostname: "resize.thingiverse.com",
      },
      {
        protocol: "https",
        hostname: "www.thingiverse.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
    proxyClientMaxBodySize: "110mb",
  },
  async redirects() {
    return STOREFRONT_CATEGORY_REDIRECTS.map((item) => ({
      source: item.source,
      destination: item.destination,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "x-bc-commit", value: appCommit },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
