import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { STORE_POLICY_SLUGS, getStorePolicy } from "@/lib/legal/store-policies";
import { ContentPage } from "@/components/content/content-layout";
import { createPageMetadata } from "@/components/content/metadata";
import { getMessages, msg } from "@/i18n/get-messages";
import { getRequestLocale } from "@/i18n/request-locale";

type LegalPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return STORE_POLICY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: LegalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const policy = getStorePolicy(slug, locale);
  const messages = getMessages(locale);
  return createPageMetadata({
    title: policy?.title ?? msg(messages, "legalIndex.title"),
    description: policy?.summary ?? "",
    path: `/yasal/${slug}`,
  });
}

export default async function LegalPolicyPage({ params }: LegalPageProps) {
  const { slug } = await params;
  const locale = await getRequestLocale();
  const messages = getMessages(locale);
  const policy = getStorePolicy(slug, locale);
  if (!policy) notFound();

  return (
    <ContentPage
      eyebrow={msg(messages, "legal.eyebrow")}
      title={policy.title}
      description={policy.summary}
      backLink={{ href: "/yasal", label: msg(messages, "legal.all") }}
    >
      <div className="mt-8 space-y-8">
        {policy.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-heading text-xl font-semibold">{section.heading}</h2>
            {section.body.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </ContentPage>
  );
}
