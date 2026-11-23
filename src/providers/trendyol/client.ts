import { serverEnv } from "@/lib/env.server";

import type { TrendyolRawProduct } from "@/providers/trendyol/map";

const PROD_BASE = "https://apigw.trendyol.com";

export function isTrendyolConfigured(): boolean {
  return Boolean(
    serverEnv.TRENDYOL_SELLER_ID &&
      serverEnv.TRENDYOL_API_KEY &&
      serverEnv.TRENDYOL_API_SECRET,
  );
}

export function trendyolConfigFlags() {
  return {
    sellerId: Boolean(serverEnv.TRENDYOL_SELLER_ID),
    apiKey: Boolean(serverEnv.TRENDYOL_API_KEY),
    apiSecret: Boolean(serverEnv.TRENDYOL_API_SECRET),
  };
}

function authHeaders(): HeadersInit {
  const sellerId = serverEnv.TRENDYOL_SELLER_ID ?? "";
  const token = Buffer.from(
    `${serverEnv.TRENDYOL_API_KEY}:${serverEnv.TRENDYOL_API_SECRET}`,
    "utf8",
  ).toString("base64");
  return {
    Authorization: `Basic ${token}`,
    "User-Agent": `${sellerId} - SelfIntegration`,
    storeFrontCode: serverEnv.TRENDYOL_STOREFRONT ?? "TR",
    Accept: "application/json",
  };
}

async function trendyolGet(path: string): Promise<Response> {
  return fetch(`${PROD_BASE}${path}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
}

export async function fetchTrendyolApprovedProducts(options?: {
  maxPages?: number;
}): Promise<{ products: TrendyolRawProduct[]; pageCount: number; total: number }> {
  if (!isTrendyolConfigured()) {
    throw new Error("Trendyol API bilgileri tanımlı değil.");
  }

  const sellerId = serverEnv.TRENDYOL_SELLER_ID;
  const maxPages = options?.maxPages ?? 20;
  const products: TrendyolRawProduct[] = [];
  let total = 0;
  let pageCount = 0;
  let nextPageToken: string | undefined;
  let useV1 = false;

  for (let page = 0; page < maxPages; page += 1) {
    const params = new URLSearchParams({
      size: "50",
      page: String(page),
      status: "onSale",
    });
    if (nextPageToken) {
      params.set("nextPageToken", nextPageToken);
      params.delete("page");
    }

    let response = useV1
      ? await trendyolGet(
          `/integration/product/sellers/${sellerId}/products?approved=true&onSale=true&size=50&page=${page}`,
        )
      : await trendyolGet(
          `/integration/product/sellers/${sellerId}/products/approved?${params.toString()}`,
        );
    if (!useV1 && (response.status === 404 || response.status === 400) && page === 0) {
      useV1 = true;
      response = await trendyolGet(
        `/integration/product/sellers/${sellerId}/products?approved=true&onSale=true&size=50&page=${page}`,
      );
    }
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Trendyol API ${response.status}: ${body.slice(0, 280) || response.statusText}`,
      );
    }

    const payload = (await response.json()) as {
      totalElements?: number;
      totalPages?: number;
      nextPageToken?: string;
      content?: TrendyolRawProduct[];
    };
    const batch = payload.content ?? [];
    products.push(...batch);
    total = payload.totalElements ?? products.length;
    pageCount += 1;
    nextPageToken = payload.nextPageToken;
    if (batch.length < 50) break;
    if (!nextPageToken && page + 1 >= (payload.totalPages ?? page + 1)) break;
  }

  return { products, pageCount, total };
}
