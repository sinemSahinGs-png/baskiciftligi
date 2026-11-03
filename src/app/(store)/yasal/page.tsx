import type { Route } from "next";

import { STORE_POLICY_SLUGS, getStorePolicy } from "@/lib/legal/store-policies";
import { ContentPage } from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { getMessages, msg } from "@/i18n/get-messages";
import { getRequestLocale } from "@/i18n/request-locale";

export async function generateMetadata() {
  const messages = getMessages(await getRequestLocale());
  return createPageMetadata({
    title: msg(messages, "legalIndex.title"),
    description: msg(messages, "legalIndex.lede"),
    path: "/yasal",
  });
}

export default async function LegalIndexPage() {
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  return (
    <ContentPage
      eyebrow={msg(messages, "legal.eyebrow")}
      title={msg(messages, "legal.contractsTitle")}
      description={msg(messages, "legal.contractsLede")}
    >
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {STORE_POLICY_SLUGS.map((slug) => {
          const policy = getStorePolicy(slug, locale);
          if (!policy) return null;
          return (
            <li key={slug} className="rounded-2xl border border-white/10 p-5">
              <a href={`/yasal/${slug}` as Route} className="font-semibold underline">
                {policy.title}
              </a>
              <p className="mt-2 text-sm text-muted-foreground">{policy.summary}</p>
            </li>
          );
        })}
      </ul>
    </ContentPage>
  );
}
