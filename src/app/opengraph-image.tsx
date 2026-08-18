import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        color: "#F9F8F5",
        background: "#070713",
        padding: "76px 82px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          right: -120,
          top: -80,
          background: "#4054FF",
          borderRadius: "50%",
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 360,
          height: 360,
          right: 80,
          bottom: -90,
          background: "#FF6542",
          borderRadius: "50%",
          opacity: 0.4,
        }}
      />
      <div
        style={{
          zIndex: 2,
          width: 780,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.05em",
          }}
        >
          {siteConfig.wordmark}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              color: "#30D5D2",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {siteConfig.tagline}
          </span>
          <span
            style={{
              marginTop: 18,
              fontSize: 62,
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
            fontSize: 20,
            color: "rgba(249,248,245,0.68)",
          }}
        >
          {siteConfig.city} · hazır koleksiyon · özel üretim
        </div>
      </div>
    </div>,
    size,
  );
}
