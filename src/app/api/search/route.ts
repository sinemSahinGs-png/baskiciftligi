import { NextResponse } from "next/server";

import { listCategories, listProducts } from "@/domain/catalog/repository";
import { discoverExternalModels } from "@/lib/model-discovery/discover";
import { clientKey, rateLimit } from "@/lib/manufacturing/rate-limit";
import { matchesTurkish } from "@/lib/search/turkish-match";

export async function GET(request: Request) {
  const limited = rateLimit({
    key: clientKey(request, "global-search"),
    limit: 60,
    windowMs: 60_000,
  });
  if (!limited.ok) {
    return NextResponse.json({ error: "Arama sınırı." }, { status: 429 });
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
  if (!query) {
    return NextResponse.json({
      query,
      products: [],
      categories: [],
      models: [],
      providers: [],
      blocked: false,
    });
  }

  const [products, categories, discovery] = await Promise.all([
    listProducts(),
    listCategories(),
    discoverExternalModels({ query, correlationId: crypto.randomUUID() }),
  ]);

  const productHits = products
    .filter((product) =>
      matchesTurkish(
        `${product.name} ${product.shortDescription ?? ""} ${product.slug}`,
        query,
      ),
    )
    .slice(0, 6)
    .map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      priceMinor: product.priceMinor,
      href: `/urun/${product.slug}`,
    }));

  const categoryHits = categories
    .filter((category) => matchesTurkish(category.name, query))
    .slice(0, 4)
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      href: `/magaza/${category.slug}`,
    }));

  const modelHits = discovery.items.slice(0, 8).map((item) => ({
    source: item.source,
    externalId: item.externalId,
    title: item.title,
    creatorName: item.creatorName,
    thumbnailUrl: item.thumbnailUrl,
    href: `/hazir-modeller/${item.source}/${item.externalId}`,
    permissionStatus: item.permissionStatus,
    automaticManufacturingAllowed: item.automaticManufacturingAllowed ?? false,
  }));

  return NextResponse.json({
    query,
    blocked: discovery.expansion.blocked,
    category: discovery.expansion.category,
    products: productHits,
    categories: categoryHits,
    models: modelHits,
    providers: discovery.providers,
  });
}
