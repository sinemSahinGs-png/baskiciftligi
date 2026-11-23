import { serverEnv } from "@/lib/env.server";

import type { TrendyolRawProduct } from "@/providers/trendyol/map";

const APIGW = "https://apigw.trendyol.com";
const SAPIGW = "https://api.trendyol.com";

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

function authHeaders(agentName: "SelfIntegration" | "Self Integration"): HeadersInit {
  const sellerId = serverEnv.TRENDYOL_SELLER_ID ?? "";
  const token = Buffer.from(
    `${serverEnv.TRENDYOL_API_KEY}:${serverEnv.TRENDYOL_API_SECRET}`,
    "utf8",
  ).toString("base64");
  return {
    Authorization: `Basic ${token}`,
    "User-Agent": `${sellerId} - ${agentName}`,
    storeFrontCode: serverEnv.TRENDYOL_STOREFRONT ?? "TR",
    Accept: "application/json",
  };
}

function extractProducts(payload: unknown): {
  products: TrendyolRawProduct[];
  total: number;
  totalPages: number;
} {
  if (Array.isArray(payload)) {
    return {
      products: payload as TrendyolRawProduct[],
      total: payload.length,
      totalPages: 1,
    };
  }
  if (!payload || typeof payload !== "object") {
    return { products: [], total: 0, totalPages: 0 };
  }
  const record = payload as {
    content?: TrendyolRawProduct[];
    products?: TrendyolRawProduct[];
    totalElements?: number;
    totalPages?: number;
  };
  const products = record.content ?? record.products ?? [];
  return {
    products,
    total: record.totalElements ?? products.length,
    totalPages: record.totalPages ?? (products.length > 0 ? 1 : 0),
  };
}

async function trendyolGet(url: string, agent: "SelfIntegration" | "Self Integration") {
  return fetch(url, {
    headers: authHeaders(agent),
    cache: "no-store",
  });
}

function listUrls(sellerId: string, page: number, size: number): string[] {
  const q = `approved=true&size=${size}&page=${page}`;
  return [
    `${APIGW}/integration/product/sellers/${sellerId}/products/approved?size=${size}&page=${page}`,
    `${APIGW}/integration/product/sellers/${sellerId}/products?${q}&onSale=true`,
    `${APIGW}/integration/product/sellers/${sellerId}/products?${q}`,
    `${SAPIGW}/sapigw/suppliers/${sellerId}/products?${q}`,
  ];
}

export async function fetchTrendyolApprovedProducts(options?: {
  page?: number;
  size?: number;
}): Promise<{
  products: TrendyolRawProduct[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}> {
  if (!isTrendyolConfigured()) {
    throw new Error("Trendyol API bilgileri tanımlı değil.");
  }

  const sellerId = serverEnv.TRENDYOL_SELLER_ID ?? "";
  const page = options?.page ?? 0;
  const size = options?.size ?? 8;
  const agents = ["SelfIntegration", "Self Integration"] as const;
  let lastError = "Trendyol ürün listesi alınamadı.";
  let empty: {
    products: TrendyolRawProduct[];
    page: number;
    size: number;
    total: number;
    totalPages: number;
  } | null = null;

  for (const url of listUrls(sellerId, page, size)) {
    for (const agent of agents) {
      const response = await trendyolGet(url, agent);
      const body = await response.text();
      if (!response.ok) {
        lastError = `Trendyol API ${response.status}: ${body.slice(0, 280) || response.statusText}`;
        continue;
      }
      let payload: unknown = {};
      try {
        payload = body ? JSON.parse(body) : {};
      } catch {
        lastError = "Trendyol yanıtı okunamadı.";
        continue;
      }
      const extracted = extractProducts(payload);
      const result = {
        products: extracted.products,
        page,
        size,
        total: extracted.total,
        totalPages: extracted.totalPages,
      };
      if (extracted.products.length === 0) {
        empty = result;
        continue;
      }
      return result;
    }
  }

  if (empty) return empty;
  throw new Error(lastError);
}
