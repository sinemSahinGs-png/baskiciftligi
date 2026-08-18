import type { Product } from "@/domain/catalog/types";
import { isPersonalizableProduct } from "@/domain/catalog/presentation";

export function ProductInfo({ product }: { product: Product }) {
  const personalizable = isPersonalizableProduct(product);
  const sections = [
    {
      id: "hikaye",
      title: "Ürün hikâyesi",
      body: product.description,
    },
    {
      id: "olculer",
      title: "Ölçüler",
      body: "Kesin ölçü, seçilen varyant ve üretim yönüne göre değişir. Katalog kaydında sabit milimetre değeri yayınlanmamıştır.",
    },
    {
      id: "malzeme",
      title: "Malzeme",
      body: "Malzeme ve renk, seçili varyant ile üretim kaydına bağlıdır. Bu sayfada doğrulanmamış malzeme listesi üretilmez.",
    },
    {
      id: "uretim",
      title: "Üretim",
      body: `${product.kind === "made_to_order" ? "Siparişe göre üretilir." : "Hazır stoktan gönderilir."} Tahmini hazırlık ${product.productionLeadTimeDays.min}–${product.productionLeadTimeDays.max} iş günüdür. Küçük yüzey farklılıkları katmanlı üretimin parçasıdır.`,
    },
    {
      id: "bakim",
      title: "Bakım",
      body: "Ürünü doğrudan güneş ve yüksek ısıdan uzak tutun. Yüzey dokusu üretim yöntemine bağlıdır.",
    },
    {
      id: "teslimat",
      title: "Teslimat",
      body: "Kargo bedeli sepet özetinde, güncel ara toplama göre hesaplanır. Teslim tarihi, en uzun hazırlık süresine göre planlanır.",
    },
    {
      id: "iade",
      title: "İade",
      body: "İade koşulları yasal metinler tamamlanınca burada bağlanır. Kişiye özel üretilen parçalar için ayrı kural uygulanabilir.",
    },
  ];

  return (
    <section
      aria-labelledby="product-details-heading"
      className="mt-16 border-t border-hairline pt-12 sm:mt-24 sm:pt-16"
    >
      <h2 id="product-details-heading" className="font-heading text-3xl font-bold">
        Ürün bilgisi
      </h2>
      {personalizable ? (
        <p className="mt-4 max-w-3xl text-sm leading-6 text-ink-secondary">
          Bu ürün kişiye özel koleksiyonda. Serbest metin veya logo işleme bu
          fazda sepete yazılmaz; renk ve varyant seçimi geçerlidir.
        </p>
      ) : null}
      <dl className="mt-8 divide-y divide-hairline border-y border-hairline">
        {sections.map((section) => (
          <div key={section.id} className="py-6">
            <dt className="font-heading text-xl font-bold">{section.title}</dt>
            <dd className="mt-3 max-w-3xl text-sm leading-7 text-ink-secondary sm:text-base">
              {section.body}
            </dd>
          </div>
        ))}
        <div className="py-6">
          <dt className="font-heading text-xl font-bold">Değerlendirmeler</dt>
          <dd className="mt-3 max-w-3xl text-sm leading-7 text-ink-secondary sm:text-base">
            Bu ürün için doğrulanmış müşteri yorumu yok. Sahte puan veya yorum
            sayısı gösterilmez.
          </dd>
        </div>
      </dl>
    </section>
  );
}
