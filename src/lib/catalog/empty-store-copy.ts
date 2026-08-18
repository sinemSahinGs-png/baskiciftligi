export const STORE_EMPTY_COPY = {
  title: "Yeni ürünler hazırlanıyor.",
  description:
    "Baskı Çiftliği koleksiyonu yakında burada olacak. Bu sırada kendi modelini yükleyebilir veya üretime hazır modelleri inceleyebilirsin.",
  actions: [
    { href: "/model-yukle", label: "Model yükle" },
    { href: "/hazir-modeller", label: "Hazır modelleri incele" },
    { href: "/kurumsal-teklif", label: "Kurumsal teklif al" },
  ],
} as const;
