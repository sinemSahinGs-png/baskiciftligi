import { siteConfig } from "@/config/site";
import { formatMoney } from "@/lib/money";
import type { WholesaleQuote } from "@/lib/wholesale/packages";
import type {
  WholesaleAddress,
  WholesaleAgreementAcceptance,
  WholesaleInvoice,
} from "@/lib/wholesale/types";

export const WHOLESALE_AGREEMENT_VERSIONS = {
  preliminary: {
    id: "on-bilgilendirme-ws-v1",
    title: "Ön Bilgilendirme Formu",
  },
  distance: {
    id: "mesafeli-satis-ws-v1",
    title: "Mesafeli Satış Sözleşmesi",
  },
  privacy: {
    id: "kvkk-gizlilik-ws-v1",
    title: "Gizlilik ve KVKK Aydınlatma",
  },
} as const;

export const WHOLESALE_LEGAL_REVIEW_REQUIRED = true;

export interface AgreementContext {
  quote: WholesaleQuote;
  customer: WholesaleAddress;
  invoice: WholesaleInvoice;
  orderNumber?: string;
}

function sellerBlock() {
  const email = siteConfig.contact.email || "doğrulanmamış";
  const phone = siteConfig.contact.phone || "doğrulanmamış";
  return [
    `Satıcı: ${siteConfig.legalName}`,
    `Marka: ${siteConfig.name}`,
    `Şehir: ${siteConfig.city}`,
    `E-posta: ${email}`,
    `Telefon: ${phone}`,
    "MERSİS, vergi dairesi, vergi numarası ve açık ticari adres bu depoda doğrulanmamıştır.",
    "Bu metin hukuk incelemesi tamamlanmadan canlı satış sözleşmesi değildir.",
  ].join("\n");
}

function orderBlock(ctx: AgreementContext) {
  const packLabel =
    ctx.quote.sku === "WS-LIGHTER-50"
      ? "50 adet karışık model kaplamalı çakmak"
      : "100 adet karışık model kaplamalı çakmak";
  const lines = [
    ctx.orderNumber ? `Sipariş no: ${ctx.orderNumber}` : "Sipariş no: ödeme başlatılınca üretilecek",
    `Paket: ${ctx.quote.sku}`,
    `Ürün: ${packLabel}`,
    `Adet fiyatı (KDV dahil): ${formatMoney(ctx.quote.unitGrossMinor)}`,
    `Ürün toplamı (KDV dahil): ${formatMoney(ctx.quote.productGrossMinor)}`,
    `Satış standı (hediye): ${formatMoney(ctx.quote.standGrossMinor)}`,
    `Kargo: ${formatMoney(ctx.quote.shippingGrossMinor)}`,
    `Ödenecek toplam: ${formatMoney(ctx.quote.grandTotalMinor)} ${ctx.quote.currency}`,
    "KDV oranı fatura kırılımı için henüz doğrulanmamıştır; gösterilen tutarlar brüt / KDV dahildir.",
    `Alıcı: ${ctx.customer.fullName}`,
    `Telefon: ${ctx.customer.phone}`,
    `E-posta: ${ctx.customer.email}`,
    `Teslimat: ${ctx.customer.line}, ${ctx.customer.district} / ${ctx.customer.city}`,
    ctx.invoice.type === "kurumsal"
      ? `Fatura: Kurumsal — ${ctx.invoice.companyName ?? ""}, ${ctx.invoice.taxOffice ?? ""}, VN ${ctx.invoice.taxNumber ?? ""}`
      : "Fatura: Bireysel",
  ];
  return lines.join("\n");
}

export function renderPreliminaryForm(ctx: AgreementContext): string {
  return [
    WHOLESALE_AGREEMENT_VERSIONS.preliminary.title,
    `Sürüm: ${WHOLESALE_AGREEMENT_VERSIONS.preliminary.id}`,
    "",
    sellerBlock(),
    "",
    orderBlock(ctx),
    "",
    "Konu: Karışık model 3D karakter kaplamalı çakmak toptan paketi ve hediye teşhir standı.",
    "Kaplamalardaki karakter görünümleri lisanslı resmi ürün, ortaklık veya onay iddiası taşımaz.",
    "Model dağılımı stok durumuna göre hazırlanır; talep notları bağlayıcı sipariş kalemi değildir.",
    "Teslimat süresi ve kargo vaadi bu formda uydurulmaz; kargo ücreti yapılandırılmış sunucu tutarıdır.",
    "Ödeme, kart bilgisi bu sitede tutulmadan PayTR güvenli ödeme alanı üzerinden alınır.",
    "Ödeme, yalnızca PayTR’nin imzalı bildiriminden sonra onaylanmış sayılır.",
  ].join("\n");
}

export function renderDistanceSales(ctx: AgreementContext): string {
  return [
    WHOLESALE_AGREEMENT_VERSIONS.distance.title,
    `Sürüm: ${WHOLESALE_AGREEMENT_VERSIONS.distance.id}`,
    "",
    sellerBlock(),
    "",
    orderBlock(ctx),
    "",
    "Bu taslak, 6502 sayılı Kanun ve mesafeli sözleşmeler yönetmeliği kapsamında hukuk danışmanı onayı bekler.",
    "Cayma, iade ve ayıplı mal hakları bu metinle daraltılamaz.",
    "Kişiye özel üretim istisnası otomatik olarak bu pakete uygulanmaz; hukuk incelemesi gerekir.",
    "Uyuşmazlıklarda tüketici hakem heyetleri ve tüketici mahkemeleri yolları saklıdır.",
  ].join("\n");
}

export function renderPrivacyNotice(ctx: AgreementContext): string {
  return [
    WHOLESALE_AGREEMENT_VERSIONS.privacy.title,
    `Sürüm: ${WHOLESALE_AGREEMENT_VERSIONS.privacy.id}`,
    "",
    `Veri sorumlusu adayı: ${siteConfig.legalName} (ticari kimlik doğrulaması eksik).`,
    "",
    "İşlenen veriler: ad soyad, telefon, e-posta, teslimat adresi, fatura tipi ve varsa unvan/vergi bilgileri, sipariş notu, sipariş ve ödeme durumu.",
    "Amaç: siparişin kurulması, ödeme, teslimat, yasal saklama ve destek.",
    "Kart verisi bu uygulamada toplanmaz; ödeme PayTR altyapısında gerçekleşir.",
    "Alıcı grupları: barındırma, ödeme kuruluşu ve (yapılandırılırsa) e-posta sağlayıcısı.",
    "Haklar: KVKK m.11 kapsamındaki başvuru hakları saklıdır.",
    "Bu aydınlatma metni hukuk incelemesi tamamlanmadan nihai KVKK metni değildir.",
    "",
    `İletişim: ${ctx.customer.email} sipariş kaydına bağlanır.`,
  ].join("\n");
}

export function buildAgreementAcceptances(
  ctx: AgreementContext,
  acceptedAt = new Date().toISOString(),
): WholesaleAgreementAcceptance[] {
  return [
    {
      versionId: WHOLESALE_AGREEMENT_VERSIONS.preliminary.id,
      title: WHOLESALE_AGREEMENT_VERSIONS.preliminary.title,
      acceptedAt,
      snapshot: renderPreliminaryForm(ctx),
    },
    {
      versionId: WHOLESALE_AGREEMENT_VERSIONS.distance.id,
      title: WHOLESALE_AGREEMENT_VERSIONS.distance.title,
      acceptedAt,
      snapshot: renderDistanceSales(ctx),
    },
    {
      versionId: WHOLESALE_AGREEMENT_VERSIONS.privacy.id,
      title: WHOLESALE_AGREEMENT_VERSIONS.privacy.title,
      acceptedAt,
      snapshot: renderPrivacyNotice(ctx),
    },
  ];
}
