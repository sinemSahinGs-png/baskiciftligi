import type { Route } from "next";
import Link from "next/link";

import { StoreCheckout } from "@/components/checkout/store-checkout";
import { createPageMetadata } from "@/components/content/metadata";
import { getViewer } from "@/lib/auth/session";
import { getMessages, msg } from "@/i18n/get-messages";
import { getRequestLocale } from "@/i18n/request-locale";

export async function generateMetadata() {
  const messages = getMessages(await getRequestLocale());
  return createPageMetadata({
    title: msg(messages, "checkout.title"),
    description: msg(messages, "checkout.lede"),
    path: "/odeme",
    noIndex: true,
  });
}

export default async function CheckoutPage() {
  const viewer = await getViewer();
  const guest = !viewer || viewer.isDemo;
  const messages = getMessages(await getRequestLocale());

  return (
    <main id="ana-icerik" className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {msg(messages, "checkout.kicker")}
      </p>
      <h1 className="mt-3 font-heading text-3xl font-semibold">{msg(messages, "checkout.title")}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
        {msg(messages, "checkout.lede")}
      </p>
      <p className="mt-4 max-w-2xl text-sm">
        {guest ? (
          <>
            Misafir olarak ödeyebilirsin. Üyeysen{" "}
            <Link href={"/giris?next=/odeme" as Route} className="underline">
              giriş yap
            </Link>
            , bilgilerin otomatik dolar.
          </>
        ) : (
          "Üye hesabınla ödüyorsun; adres ve e-posta dolduruldu."
        )}
      </p>
      <div className="mt-8">
        <StoreCheckout
          email={!guest && viewer ? viewer.email : ""}
          displayName={!guest && viewer ? viewer.displayName : ""}
        />
      </div>
    </main>
  );
}
