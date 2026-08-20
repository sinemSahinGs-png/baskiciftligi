import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CuratedModelDetail } from "@/components/models/curated-model-detail";
import { getPublishedCuratedModel } from "@/domain/curated-models/repository";
import { siteConfig } from "@/config/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const model = await getPublishedCuratedModel(slug);
  if (!model) {
    return { title: "Model bulunamadı" };
  }
  return {
    title: model.titleTr,
    description: model.description ?? `${model.titleTr} — ${siteConfig.name}`,
    alternates: { canonical: `/hazir-modeller/katalog/${model.slug}` },
  };
}

export default async function CuratedCatalogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = await getPublishedCuratedModel(slug);
  if (!model || model.status !== "published") {
    notFound();
  }
  return <CuratedModelDetail model={model} />;
}
