import type { Route } from "next";
import Link from "next/link";

import { PriceDisplay } from "@/components/commerce/price-display";
import { SafeImage } from "@/components/media/safe-image";
import type { Product } from "@/domain/catalog/types";

export function RealProducts({ products }: { products: Product[] }) {
  const visible = products.slice(0, 4);

  return (
    <section
      id="mevcut-urunler"
      data-home-theme="mono"
      className="hi-section"
      aria-labelledby="real-products-heading"
    >
      <div className="hi-shell">
        <div className="flex items-end justify-between gap-3">
          <h2 id="real-products-heading" className="hi-title">
            MAĞAZA ÜRÜNLERİ
          </h2>
          <Link href={"/magaza" as Route} className="hi-link shrink-0">
            Tüm ürünleri gör →
          </Link>
        </div>
        {visible.length === 0 ? (
          <p className="hi-lede">Yayında ürün bulunamadı.</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 gap-px border border-[color:var(--bc-line)]">
            {visible.map((product) => (
              <li key={product.id} className="bg-[color:var(--bc-panel)]">
                <Link
                  href={`/urun/${product.slug}` as Route}
                  className="block"
                  data-real-product-slug={product.slug}
                >
                  <span className="relative block aspect-[4/5] overflow-hidden">
                    <SafeImage
                      src={product.media[0]?.url}
                      alt={product.media[0]?.alt ?? product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 280px"
                      className="object-cover"
                    />
                  </span>
                  <span className="block p-3">
                    <span className="line-clamp-2 text-sm font-semibold">{product.name}</span>
                    <PriceDisplay
                      priceMinor={product.priceMinor}
                      compareAtPriceMinor={product.compareAtPriceMinor}
                      className="mt-2"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
