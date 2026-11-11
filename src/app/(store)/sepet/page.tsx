import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";
import { PageMasthead } from "@/components/motion/page-masthead";
import { siteConfig } from "@/config/site";
import { getMessages, msg } from "@/i18n/get-messages";
import { getRequestLocale } from "@/i18n/request-locale";

export const metadata: Metadata = {
  title: "Sepet",
  description: `${siteConfig.name} sepetiniz ve sunucuda doğrulanan sipariş özeti.`,
  alternates: { canonical: "/sepet" },
  robots: { index: false, follow: false },
};

export default async function CartPage() {
  const messages = getMessages(await getRequestLocale());
  return (
    <main id="ana-icerik" className="store-page">
      <header className="store-masthead">
        <div className="shell py-10 sm:py-14">
          <PageMasthead
            eyebrow={msg(messages, "commerce.cartEyebrow")}
            title={msg(messages, "commerce.cartTitle")}
            description={msg(messages, "commerce.cartLede")}
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
