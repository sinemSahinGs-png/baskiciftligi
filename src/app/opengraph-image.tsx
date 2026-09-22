import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const mark = await readFile(path.join(process.cwd(), "public", "icons", "icon-192.png"));
  const markSrc = `data:image/png;base64,${mark.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        color: "#F5F4EF",
        background: "#070909",
        padding: "64px 72px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          right: 72,
          top: 64,
          width: 168,
          height: 168,
          display: "flex",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={markSrc} width={168} height={168} alt="" />
      </div>
      <div
        style={{
          zIndex: 2,
          width: 820,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.04em",
          }}
        >
          {siteConfig.wordmark}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              color: "#FF5A0A",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {siteConfig.tagline}
          </span>
          <span
            style={{
              marginTop: 18,
              fontSize: 58,
              lineHeight: 0.98,
              fontWeight: 800,
              letterSpacing: "-0.05em",
            }}
          >
            {siteConfig.hero.headline}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 18,
            color: "rgba(245,244,239,0.68)",
          }}
        >
          {siteConfig.city} · hazır koleksiyon · özel üretim
        </div>
      </div>
    </div>,
    size,
  );
}
