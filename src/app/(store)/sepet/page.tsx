import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { PageMasthead } from "@/components/motion/page-masthead";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Sepet",
  description: `${siteConfig.name} sepetiniz ve sunucuda doğrulanan sipariş özeti.`,
  alternates: { canonical: "/sepet" },
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <main id="ana-icerik" className="store-page">
      <header className="store-masthead">
        <div className="shell py-10 sm:py-14">
          <PageMasthead
            eyebrow="Sipariş özeti"
            title="Sepet"
            description="Fiyat, stok ve hazırlık süresi her değişiklikte sunucudan yeniden doğrulanır. Mağaza, kişiselleştirilmiş, yüklenen ve lisanslı satırlar ayrı işaretlenir."
            titleClassName="store-intro-title mt-4"
            descriptionClassName="store-intro-lede mt-4"
          />
        </div>
      </header>
      <section className="shell py-10 sm:py-12" data-visual-landmark>
        <CartView />
      </section>
    </main>
  );
}
