import "server-only";

import { cookies } from "next/headers";

import { listAdminOrders } from "@/domain/admin/order-board";
import { listAdminProducts } from "@/domain/catalog/admin-repository";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import {
  getPaytrCredentials,
  isPaytrTestMode,
} from "@/lib/wholesale/credentials";
import { isTrendyolConfigured } from "@/providers/trendyol/client";

export const OPS_QUEST_COOKIE = "octo_ops_quests";

export type QuestLane = "site" | "growth";

export type OpsQuest = {
  id: string;
  lane: QuestLane;
  title: string;
  why: string;
  xp: number;
  href: string;
  cta: string;
  done: boolean;
  auto: boolean;
};

function parseDoneIds(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export async function getOpsBoard(): Promise<{
  quests: OpsQuest[];
  openSite: number;
  openGrowth: number;
  xp: number;
  maxXp: number;
}> {
  const store = await cookies();
  const marked = parseDoneIds(store.get(OPS_QUEST_COOKIE)?.value);
  const [products, orders] = await Promise.all([
    listAdminProducts().catch(() => []),
    listAdminOrders({ limit: 40 }).catch(() => []),
  ]);

  const missingImage = products.filter(
    (product) => product.status !== "archived" && product.media.length === 0,
  ).length;
  const drafts = products.filter((product) => product.status === "draft").length;
  const active = products.filter((product) => product.status === "active").length;
  const paytrLive =
    Boolean(getPaytrCredentials()) && !isPaytrTestMode();
  const contactReady = Boolean(
    publicEnv.NEXT_PUBLIC_CONTACT_EMAIL || publicEnv.NEXT_PUBLIC_CONTACT_PHONE,
  );
  const instagramReady = Boolean(publicEnv.NEXT_PUBLIC_INSTAGRAM_URL);
  const paidOrder = orders.some((order) => order.paymentStatus === "paid");
  const trendyolReady = isTrendyolConfigured() && active >= 8;

  const quests: OpsQuest[] = [
    {
      id: "paytr-live",
      lane: "site",
      title: "PayTR canlı tahsilat",
      why: "Kart şu an testte. Mağaza açılınca canlı merchant bilgisi ve TEST_MODE=0 gerekir.",
      xp: 120,
      href: "/admin/gorevler",
      cta: "Nasıl",
      done: paytrLive,
      auto: true,
    },
    {
      id: "trendyol-pull",
      lane: "site",
      title: "Trendyol kataloğunu çek",
      why: "Satıştaki ürün, fiyat ve görseller OCTO vitrine düşmeli.",
      xp: 80,
      href: "/admin/trendyol",
      cta: "Trendyol",
      done: trendyolReady,
      auto: true,
    },
    {
      id: "product-images",
      lane: "site",
      title: "Görselsiz ürünleri tamamla",
      why: `${missingImage} üründe kapak yok. Vitrin ve reklam boş kare gösterir.`,
      xp: 70,
      href: "/admin/urunler",
      cta: "Ürünler",
      done: missingImage === 0 && products.length > 0,
      auto: true,
    },
    {
      id: "publish-drafts",
      lane: "site",
      title: "Taslak ürünleri yayınla",
      why: `${drafts} taslak vitrinde görünmez. Fiyatı olanları active yap.`,
      xp: 50,
      href: "/admin/urunler",
      cta: "Ürünler",
      done: drafts === 0 && active > 0,
      auto: true,
    },
    {
      id: "contact",
      lane: "site",
      title: "İletişim e-posta / telefon",
      why: "Toptan ve destek formları boş kalır; Google İşletme ile de çelişir.",
      xp: 40,
      href: "/admin/icerik",
      cta: "İçerik",
      done: contactReady,
      auto: true,
    },
    {
      id: "instagram",
      lane: "site",
      title: "Instagram vitrin linki",
      why: "Mağaza altbilgisi ve reklam çıkışı aynı profile bağlanmalı.",
      xp: 30,
      href: "/admin/icerik",
      cta: "İçerik",
      done: instagramReady,
      auto: true,
    },
    {
      id: "first-paid",
      lane: "site",
      title: "İlk gerçek ödeme",
      why: "Küçük bir canlı sipariş PayTR, kargo ve fatura zincirini doğrular.",
      xp: 100,
      href: "/admin/siparisler",
      cta: "Siparişler",
      done: paidOrder,
      auto: true,
    },
    {
      id: "seo-search-console",
      lane: "growth",
      title: "Google Search Console",
      why: "octostudio.com.tr mülkünü doğrula, sitemap gönder, indeks hatalarını kapat.",
      xp: 60,
      href: "/admin/gorevler",
      cta: "İşaretle",
      done: marked.has("seo-search-console"),
      auto: false,
    },
    {
      id: "google-business",
      lane: "growth",
      title: "Google İşletme Profili",
      why: "Harita, yorum ve yerel arama. Mağaza adı OCTO STUDIO, site octostudio.com.tr.",
      xp: 55,
      href: "/admin/gorevler",
      cta: "İşaretle",
      done: marked.has("google-business"),
      auto: false,
    },
    {
      id: "merchant-center",
      lane: "growth",
      title: "Google Merchant Center",
      why: "Ürün feed’i olmadan Shopping ve performans max kampanyası açılmaz.",
      xp: 70,
      href: "/admin/trendyol",
      cta: "Katalog",
      done: marked.has("merchant-center"),
      auto: false,
    },
    {
      id: "google-ads",
      lane: "growth",
      title: "Google Ads deneme kampanyası",
      why: "Marka + 3 ürün grubu, düşük bütçe, dönüşüm: satın alma.",
      xp: 80,
      href: "/admin/gorevler",
      cta: "İşaretle",
      done: marked.has("google-ads"),
      auto: false,
    },
    {
      id: "meta-ads",
      lane: "growth",
      title: "Instagram / Meta reklam",
      why: "Katalog satış veya trafik. Piksel ve dönüşüm API sonra.",
      xp: 80,
      href: "/admin/gorevler",
      cta: "İşaretle",
      done: marked.has("meta-ads"),
      auto: false,
    },
    {
      id: "analytics",
      lane: "growth",
      title: "GA4 + dönüşüm olayları",
      why: "view_item, add_to_cart, purchase olmadan reklam bütçesi kör gider.",
      xp: 50,
      href: "/admin/gorevler",
      cta: "İşaretle",
      done: marked.has("analytics"),
      auto: false,
    },
  ];

  const xp = quests.filter((item) => item.done).reduce((sum, item) => sum + item.xp, 0);
  const maxXp = quests.reduce((sum, item) => sum + item.xp, 0);
  return {
    quests,
    openSite: quests.filter((item) => item.lane === "site" && !item.done).length,
    openGrowth: quests.filter((item) => item.lane === "growth" && !item.done).length,
    xp,
    maxXp,
  };
}
