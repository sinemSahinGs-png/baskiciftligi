"use client";

import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    value: "magaza-durumu",
    question: "Sitedeki ürünler şu anda satın alınabilir mi?",
    answer: (
      <>
        Phase 1 katalog kayıtları geliştirme ortamında açıkça demo olarak
        işaretlenebilir. PayTR checkout ve sipariş tamamlama aktif olmadığı için
        ödeme alınmaz. Bir kaydın gerçek satışa açık olduğu, ancak canlı
        katalog, stok ve ödeme altyapısı birlikte doğrulandıktan sonra kabul
        edilmelidir.
      </>
    ),
  },
  {
    value: "model-yukleme",
    question: "STL, OBJ veya 3MF dosyası yükleyebilir miyim?",
    answer: (
      <>
        Henüz hayır. Özel model yükleme, güvenli depolama, tarayıcı önizlemesi
        ve manuel teklif akışı Phase 3 kapsamındadır.{" "}
        <Link href="/model-yukle">Model yükleme durum sayfası</Link> dosya
        seçmez, kabul etmez veya saklamaz.
      </>
    ),
  },
  {
    value: "otomatik-fiyat",
    question: "Otomatik baskı fiyatı nasıl hesaplanıyor?",
    answer: (
      <>
        Şu anda otomatik fiyat motoru yoktur. Güvenilir bir hesap için geometri
        analizi, teknolojiye özel dilimleme, malzeme, süre, destek, hata payı ve
        sürümlenmiş fiyat kurallarının server tarafında doğrulanması gerekir.
        Tarayıcıdaki bir tahmin bağlayıcı fiyat kabul edilmemelidir.
      </>
    ),
  },
  {
    value: "malzeme-secimi",
    question: "Hangi malzemeyi seçmeliyim?",
    answer: (
      <>
        Seçim; parçanın görevi, sıcaklık, UV, nem, darbe, esneklik ve yüzey
        beklentisine göre değişir.{" "}
        <Link href="/malzemeler">Malzeme karşılaştırma sayfasındaki</Link>{" "}
        puanlar göreceli rehberdir; sertifikalı teknik değer yerine geçmez.
      </>
    ),
  },
  {
    value: "uretim-suresi",
    question: "Üretim ve teslimat ne kadar sürer?",
    answer: (
      <>
        Her sipariş için geçerli tek bir süre beyanı yoktur. Adet, geometri,
        malzeme, numune onayı, makine planı ve kargo yöntemi netleşmeden kesin
        termin verilmemelidir. Canlı satış açıldığında süre, sipariş anındaki
        ürün veya teklif kaydında açıkça gösterilmelidir.
      </>
    ),
  },
  {
    value: "thingiverse",
    question: "Thingiverse modellerini burada satın alabilir miyim?",
    answer: (
      <>
        Hayır. Resmî Thingiverse API entegrasyonu Phase 5’e aittir ve credential
        olmadan devre dışıdır. Site Thingiverse’i taramaz. Bir modelin ticari
        üretim izni ayrıca doğrulanmadan sepete ekleme veya satın alma açılmaz.
      </>
    ),
  },
  {
    value: "kurumsal-talep",
    question: "Kurumsal üretim talebi nasıl iletilir?",
    answer: (
      <>
        <Link href="/kurumsal-teklif">Kurumsal teklif sayfası</Link> brief
        hazırlamak için gerekli alanları listeler. Supabase lead kaydı ve
        e-posta iletimi bağlanmadıysa sayfa talep gönderilmiş gibi davranmaz;
        yalnızca yapılandırılmış iletişim hazırlığı sunar.
      </>
    ),
  },
  {
    value: "iade",
    question: "İade ve cayma koşulları nelerdir?",
    answer: (
      <>
        Yasal sayfalar şu anda üretime hazır politika değil, hukuk incelemesi
        bekleyen şablonlardır. Standart ürün, kişiye özel üretim ve ayıplı ürün
        senaryoları Türk tüketici mevzuatı kapsamında ayrı değerlendirilmelidir.
        Canlı satış, onaylı satıcı bilgileri ve nihai metinler olmadan
        açılmamalıdır.
      </>
    ),
  },
] as const;

export function FaqAccordion() {
  return (
    <Accordion className="overflow-hidden rounded-2xl border border-white/10 bg-card/60">
      {faqItems.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value}
          className="px-5 sm:px-7"
        >
          <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline sm:py-6 sm:text-lg">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="max-w-3xl pb-6 text-sm leading-7 text-muted-foreground sm:text-base">
            <p>{item.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
