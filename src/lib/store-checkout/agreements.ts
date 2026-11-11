import { siteConfig } from "@/config/site";

export const STORE_AGREEMENT_VERSIONS = {
  preliminary: { id: "on-bilgilendirme-v1", title: "Ön Bilgilendirme Formu" },
  distance: { id: "mesafeli-satis-v1", title: "Mesafeli Satış Sözleşmesi" },
  privacy: { id: "kvkk-gizlilik-v1", title: "Gizlilik ve KVKK" },
} as const;

export function sellerContactLines() {
  return [
    `Satıcı: ${siteConfig.legalName}`,
    `Marka: ${siteConfig.name}`,
    `Şehir: ${siteConfig.city}`,
    `E-posta: ${siteConfig.contact.email || "iletisim henüz doğrulanmadı"}`,
    `Telefon: ${siteConfig.contact.phone || "telefon henüz doğrulanmadı"}`,
  ];
}
