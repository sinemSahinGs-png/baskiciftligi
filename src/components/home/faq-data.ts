export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    id: "hangi-dosyalar",
    question: "Hangi 3D model dosyalarını gönderebilirim?",
    answer:
      "Teklif akışı STL, OBJ, 3MF, STEP ve STP dosyalarını kabul edecek şekilde tasarlanmıştır. Üretilebilirlik kontrolü dosya yüklendikten sonra yapılır; dosyanın seçilmesi otomatik olarak üretim onayı anlamına gelmez.",
  },
  {
    id: "model-yok",
    question: "3D modelim yoksa yine de üretim yaptırabilir miyim?",
    answer:
      "Evet. Ölçü, kullanım amacı ve varsa referans görsellerle iletişime geçebilirsin. Tasarım hizmetinin kapsamı ve ücreti, üretim teklifinden önce açıkça paylaşılır.",
  },
  {
    id: "malzeme-secimi",
    question: "Hangi malzemenin uygun olduğuna nasıl karar veriliyor?",
    answer:
      "Parçanın yük, sıcaklık, esneklik, yüzey ve kullanım ortamı gereksinimleri değerlendirilir. PLA, PETG, TPU, ASA ve reçine seçenekleri arasından öneri sunulur; son seçim teklif sırasında netleşir.",
  },
  {
    id: "sure",
    question: "Üretim ne kadar sürer?",
    answer:
      "Süre; model geometrisi, malzeme, adet ve mevcut üretim planına göre değişir. Katalog ürünlerinde tahmini hazırlık aralığı ürün kartında, özel üretimde ise dosya incelemesinden sonra teklifte gösterilir.",
  },
  {
    id: "toplu-uretim",
    question: "Kurumsal veya toplu üretim yapılabiliyor mu?",
    answer:
      "Küçük seri, promosyon, prototip ve tekrarlı parça talepleri ayrı bir kurumsal akışta değerlendirilir. Kapasite, birim maliyet ve teslim planı numune ya da dosya incelemesinden sonra belirlenir.",
  },
  {
    id: "renk-yuzey",
    question: "Renk ve yüzey seçenekleri görsellerle birebir aynı mı?",
    answer:
      "Ekran ve üretim partisi farklılıkları nedeniyle renkler küçük değişiklikler gösterebilir. Kritik renk veya yüzey beklentilerinde üretim öncesi numune ve yazılı onay önerilir.",
  },
];
