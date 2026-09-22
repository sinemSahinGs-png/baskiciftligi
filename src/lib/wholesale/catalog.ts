import { PRODUCTION_SITE_URL } from "@/config/site";

export const WHOLESALE_CATALOG_PATH = "/toptan/katalog";
export const WHOLESALE_CATALOG_SHORT_PATH = "/katalog";
export const WHOLESALE_CATALOG_QR_ASSET = "/images/wholesale/katalog-qr.svg";
export const WHOLESALE_CATALOG_QR_PNG = "/images/wholesale/katalog-qr.png";

export const WHOLESALE_CATALOG_COPY = {
  eyebrow: "Toptan katalog",
  title: "Rafına alacağın ürünler.",
  lede: "Kartvizitteki kod bu sayfayı açar. Görülen fiyat perakende referanstır; toptan adet teklifte netleşir.",
  emptyTitle: "Katalog şu anda boş.",
  emptyBody:
    "Yayınlanan ürünler burada görünür. Toptan fiyat için brief bırakın; boş katalog uydurulmaz.",
  retailLabel: "Perakende referans",
  wholesaleNote:
    "Toptan fiyat, adet ve üretim brief’ine göre teklifte netleşir.",
  quoteLabel: "Toptan teklif al",
  openCatalogLabel: "Katalogu aç",
  qrLabel: "Kartvizit QR",
  qrHint: "Bu kodu kartvizite bas. Açılınca toptan katalog gelir.",
  copyLinkLabel: "Linki kopyala",
} as const;

export function wholesaleCatalogQrUrl(
  baseUrl: string = PRODUCTION_SITE_URL,
): string {
  return new URL(WHOLESALE_CATALOG_SHORT_PATH, withTrailingSlash(baseUrl)).toString();
}

export function productMeasureLabel(product: {
  widthMm?: number | null;
  depthMm?: number | null;
  heightMm?: number | null;
}): string | null {
  const values = [product.widthMm, product.depthMm, product.heightMm].filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value) && value > 0,
  );
  if (values.length === 0) {
    return null;
  }
  return `${values.join(" × ")} mm`;
}

function withTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}
