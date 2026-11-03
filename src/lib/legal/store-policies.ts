import { siteConfig } from "@/config/site";
import { getMessages, msg } from "@/i18n/get-messages";
import type { AppLocale } from "@/i18n/config";
import { sellerContactLines } from "@/lib/store-checkout/agreements";

export const STORE_POLICY_SLUGS = [
  "kvkk",
  "gizlilik",
  "mesafeli-satis",
  "iade",
] as const;

export type StorePolicySlug = (typeof STORE_POLICY_SLUGS)[number];

export function getStorePolicy(slug: string, locale: AppLocale = "tr") {
  const contact = sellerContactLines().join("\n");
  const messages = getMessages(locale);
  const titles = {
    kvkk: msg(messages, "legal.kvkkTitle"),
    gizlilik: msg(messages, "legal.privacyTitle"),
    "mesafeli-satis": msg(messages, "legal.distanceTitle"),
    iade: msg(messages, "legal.returnsTitle"),
  };
  const summaries = {
    kvkk: msg(messages, "legal.kvkkSummary"),
    gizlilik: msg(messages, "legal.privacySummary"),
    "mesafeli-satis": msg(messages, "legal.distanceSummary"),
    iade: msg(messages, "legal.returnsSummary"),
  };
  const policies: Record<
    StorePolicySlug,
    { title: string; summary: string; sections: Array<{ heading: string; body: string[] }> }
  > = {
    kvkk: {
      title: titles.kvkk,
      summary: summaries.kvkk,
      sections: [
        {
          heading: "Veri sorumlusu",
          body: [contact, "Başvurular iletişim e-postası üzerinden kabul edilir."],
        },
        {
          heading: "İşlenen veriler",
          body: [
            "Üyelik: ad, e-posta, şifre özeti (Supabase Auth).",
            "Sipariş: teslimat adresi, telefon, sepet kalemleri, ödeme durumu.",
            "Destek: özel sipariş formundaki not ve iletişim bilgileri.",
            "Ödeme kartı verisi sitemizde tutulmaz; PayTR tarafından işlenir.",
          ],
        },
        {
          heading: "Hukuki sebepler",
          body: [
            "Sözleşmenin kurulması ve ifası (sipariş, üretim, kargo).",
            "Yasal yükümlülük (fatura, tüketici işlemleri).",
            "Meşru menfaat (dolandırıcılık önleme, destek kayıtları).",
          ],
        },
      ],
    },
    gizlilik: {
      title: titles.gizlilik,
      summary: summaries.gizlilik,
      sections: [
        {
          heading: "Toplanan bilgiler",
          body: [
            "Hesap oluştururken verdiğin ad ve e-posta.",
            "Sipariş ve kargo için adres ve telefon.",
            "Yüklenen 3D dosyalar yalnız üretim için saklanır.",
          ],
        },
        {
          heading: "Paylaşım",
          body: [
            "PayTR: ödeme tahsilatı.",
            "Supabase: hesap ve sipariş kaydı.",
            "Kargo sağlayıcısı: teslimat için gerekli adres bilgisi.",
          ],
        },
      ],
    },
    "mesafeli-satis": {
      title: titles["mesafeli-satis"],
      summary: summaries["mesafeli-satis"],
      sections: [
        {
          heading: "Satıcı",
          body: [contact],
        },
        {
          heading: "Konu",
          body: [
            "Konu, siteden sipariş edilen hazır ürün, toptan paket veya kişiye özel 3D baskı üretimidir.",
            "Ödenecek tutar ödeme adımında sunucunun hesapladığı KDV dahil toplamdır.",
            "Ödeme PayTR altyapısı ile tahsil edilir. Sipariş ancak PayTR geri bildirimi doğrulanınca ödendi sayılır.",
          ],
        },
        {
          heading: "Teslimat",
          body: [
            `${siteConfig.city} çıkışlı kargo. Üretim süreleri ürüne ve dilimleme sonucuna göre değişir.`,
            "Kişiye özel üretilen modeller teslimattan sonra standart cayma kapsamı dışında kalabilir.",
          ],
        },
      ],
    },
    iade: {
      title: titles.iade,
      summary: summaries.iade,
      sections: [
        {
          heading: "Cayma",
          body: [
            "Katalogdaki stok ürünlerde yasal cayma hakkı saklıdır.",
            "İsme/ölçüye özel üretilen veya müşteri dosyasından basılan ürünler, tüketici mevzuatındaki istisnalar nedeniyle cayma dışı olabilir.",
          ],
        },
        {
          heading: "Ayıplı teslimat",
          body: [
            "Hasarlı veya hatalı üretimde fotoğraflı bildirim alınır; onarım, yeniden üretim veya iade değerlendirilir.",
            `İletişim: ${siteConfig.contact.email || siteConfig.contact.phone || siteConfig.url}`,
          ],
        },
      ],
    },
  };
  return policies[slug as StorePolicySlug] ?? null;
}
