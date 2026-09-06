export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    id: "hangi-dosyalar",
    question: "Hangi dosyaları gönderebilirim?",
    answer:
      "STL ve 3MF üretim akışının ana formatlarıdır. OBJ, STEP ve STP de teklif için kabul edilir. Dosya seçmek otomatik üretim onayı değildir.",
  },
  {
    id: "model-yok",
    question: "Modelim yoksa ne olur?",
    answer:
      "Fikrini yazıp hazır model arayabilir, kütüphaneden seçebilir veya ölçü ve referansla iletişime geçebilirsin.",
  },
  {
    id: "fiyat",
    question: "Fiyat ne zaman netleşir?",
    answer:
      "Hazır üründe karttaki fiyat geçerlidir. Yüklenen modellerde fiyat, PrusaSlicer çıktısı ve imzalı formülden sonra gösterilir.",
  },
  {
    id: "toplu-uretim",
    question: "Kurumsal üretim var mı?",
    answer:
      "Numune ve tekrarlı işler kurumsal teklif formundan yürür. Kapasite iddiası, dosya veya brief incelenmeden verilmez.",
  },
];
