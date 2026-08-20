import "server-only";

import { validateCuratedSourceUrl, type CuratedPlatform } from "@/domain/curated-models/types";

export interface OpenGraphPreview {
  title: string | null;
  description: string | null;
  imageUrl: string | null;
  note: string;
}

/**
 * Best-effort Open Graph peek for admin convenience.
 * Does not scrape Printables HTML, does not copy remote images, does not publish.
 */
export async function peekOpenGraphMetadata(input: {
  url: string;
  platform: CuratedPlatform;
}): Promise<OpenGraphPreview> {
  const check = validateCuratedSourceUrl(input.url, input.platform);
  if (!check.ok) {
    return {
      title: null,
      description: null,
      imageUrl: null,
      note: check.error,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(check.canonicalUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        Accept: "text/html",
        "User-Agent": "BaskiCiftligiCuratedCatalog/1.0 (+https://baskiciftligi.com)",
      },
    });
    if (!response.ok) {
      return {
        title: null,
        description: null,
        imageUrl: null,
        note: `Kaynak ${response.status} döndü. Alanları elle doldurun.`,
      };
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return {
        title: null,
        description: null,
        imageUrl: null,
        note: "HTML Open Graph bulunamadı. Alanları elle doldurun.",
      };
    }
    const html = (await response.text()).slice(0, 250_000);
    const title =
      metaContent(html, "og:title") ??
      metaContent(html, "twitter:title") ??
      titleTag(html);
    const description =
      metaContent(html, "og:description") ?? metaContent(html, "description");
    const imageUrl = metaContent(html, "og:image") ?? metaContent(html, "twitter:image");

    return {
      title: title?.slice(0, 160) ?? null,
      description: description?.slice(0, 400) ?? null,
      imageUrl: null, // never auto-copy or hotlink; owner must upload
      note: imageUrl
        ? "Başlık/açıklama önerildi. Uzak görsel kopyalanmadı; kapak görselini yükleyin."
        : "Open Graph okundu. Eksik alanları elle tamamlayın.",
    };
  } catch {
    return {
      title: null,
      description: null,
      imageUrl: null,
      note: "Open Graph okunamadı. Alanları elle doldurun.",
    };
  } finally {
    clearTimeout(timer);
  }
}

function metaContent(html: string, property: string) {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escapeRegExp(property)}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapeRegExp(property)}["']`,
      "i",
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1].trim());
    }
  }
  return null;
}

function titleTag(html: string) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtml(match[1].trim()) : null;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
