import { SpecialOrderForm } from "@/components/support/special-order-form";
import { createPageMetadata } from "@/components/content/metadata";
import { getMessages, msg } from "@/i18n/get-messages";
import { getRequestLocale } from "@/i18n/request-locale";

export async function generateMetadata() {
  const messages = getMessages(await getRequestLocale());
  return createPageMetadata({
    title: msg(messages, "special.title"),
    description: msg(messages, "special.lede"),
    path: "/ozel-siparis",
  });
}

export default async function SpecialOrderPage() {
  const messages = getMessages(await getRequestLocale());
  return (
    <main id="ana-icerik" className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
        {msg(messages, "special.kicker")}
      </p>
      <h1 className="mt-3 font-heading text-3xl font-semibold sm:text-4xl">
        {msg(messages, "special.title")}
      </h1>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
        {msg(messages, "special.lede")}
      </p>
      <div className="mt-8">
        <SpecialOrderForm />
      </div>
    </main>
  );
}
