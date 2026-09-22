import { createPageMetadata } from "@/components/content/metadata";
import { WholesaleCatalog } from "@/components/wholesale/wholesale-catalog";
import { getCatalogSnapshot, listProducts } from "@/domain/catalog/repository";
import { WHOLESALE_CATALOG_COPY, WHOLESALE_CATALOG_PATH } from "@/lib/wholesale/catalog";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Toptan katalog",
  description: WHOLESALE_CATALOG_COPY.lede,
  path: WHOLESALE_CATALOG_PATH,
});

export default async function WholesaleCatalogPage() {
  const [products, snapshot] = await Promise.all([
    listProducts(),
    getCatalogSnapshot(),
  ]);

  return (
    <main id="ana-icerik">
      <WholesaleCatalog
        products={products}
        unavailable={snapshot.unavailable === true}
      />
    </main>
  );
}
