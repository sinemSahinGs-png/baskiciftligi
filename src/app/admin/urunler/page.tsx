import Link from "next/link";
import type { Metadata } from "next";
import { FlaskConical, PackageOpen, Plus, Search, Settings2 } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { ProductCatalogTable } from "@/components/admin/product-catalog-table";
import { getAdminCatalogOverview } from "@/domain/catalog/admin-repository";
import type { ProductStatus } from "@/domain/catalog/types";
import { isE2eCatalogFixture } from "@/lib/catalog/e2e-fixture";
import { allowDemoCatalogImport } from "@/lib/catalog/source";
import { allowProductionDemoImport } from "@/lib/env";

export const metadata: Metadata = {
  title: "Ürün yönetimi",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    kategori?: string | string[];
    stok?: string | string[];
    oneCikan?: string | string[];
    sira?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const searchValue = (Array.isArray(query.q) ? query.q[0] : query.q)?.trim() ?? "";
  const rawStatus = Array.isArray(query.status) ? query.status[0] : query.status;
  const status = isProductStatus(rawStatus) ? rawStatus : "";
  const category =
    (Array.isArray(query.kategori) ? query.kategori[0] : query.kategori) ?? "";
  const stock = (Array.isArray(query.stok) ? query.stok[0] : query.stok) ?? "";
  const featured =
    (Array.isArray(query.oneCikan) ? query.oneCikan[0] : query.oneCikan) ?? "";
  const sort = (Array.isArray(query.sira) ? query.sira[0] : query.sira) ?? "updated";
  const overview = await getAdminCatalogOverview();
  const normalizedSearch = searchValue.toLocaleLowerCase("tr-TR");
  const products = overview.products
    .filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        `${product.name} ${product.slug} ${product.sku}`
          .toLocaleLowerCase("tr-TR")
          .includes(normalizedSearch);
      const matchesStatus = !status || product.status === status;
      const matchesCategory =
        !category || product.categorySlugs.includes(category);
      const matchesStock =
        stock === "low"
          ? product.inventoryQuantity <= 5
          : stock === "out"
            ? product.inventoryQuantity === 0
            : stock === "in"
              ? product.inventoryQuantity > 0
              : true;
      const matchesFeatured = featured === "1" ? product.featured : true;
      const matchesFixture =
        Boolean(normalizedSearch) || !isE2eCatalogFixture(product);
      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesStock &&
        matchesFeatured &&
        matchesFixture
      );
    })
    .sort((left, right) => {
      if (sort === "name") {
        return left.name.localeCompare(right.name, "tr");
      }
      if (sort === "price") {
        return left.priceMinor - right.priceMinor;
      }
      if (sort === "stock") {
        return left.inventoryQuantity - right.inventoryQuantity;
      }
      return (right.updatedAt ?? right.publishedAt ?? "").localeCompare(
        left.updatedAt ?? left.publishedAt ?? "",
      );
    });
  const demoImportAllowed = allowDemoCatalogImport({
    nodeEnv: process.env.NODE_ENV,
    allowProductionImport: allowProductionDemoImport,
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Katalog / Ürünler"
        title="Ürün yönetimi"
        description="Ürün, varyant, stok, yayın, medya ve SEO kayıtlarını kalıcı katalogdan yönetin. Toplu silme yoktur; arşiv standart güvenli eylemdir."
        actions={
          <Link
            href="/admin/urunler/yeni"
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cyan px-5 text-sm font-bold text-ink transition-colors hover:bg-[#63e2ff]"
          >
            <Plus className="size-4" aria-hidden="true" />
            Yeni ürün
          </Link>
        }
      />

      {overview.mode === "demo" ? (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-warm/25 bg-warm/8 p-4 text-sm text-warm">
          <FlaskConical className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            <strong>Geliştirme demo katalogu:</strong> Değişiklikler yalnızca bu
            makinedeki .octo-data dosyasına yazılır. Üretimde bu yedek
            kullanılmaz.
          </p>
        </div>
      ) : null}

      {overview.mode === "unconfigured" ? (
        <div className="mb-5 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
          Kalıcı katalog yapılandırılmadı. NEXT_PUBLIC_SUPABASE_URL ve anon anahtar
          olmadan üretim vitrini boş kalır; JSON dosyasına sessiz geçiş yoktur.
        </div>
      ) : null}

      <section className="mb-5 rounded-3xl border border-white/10 bg-card p-4">
        <form action="/admin/urunler" className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label className="relative md:col-span-2">
            <span className="sr-only">Ürün ara</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              name="q"
              defaultValue={searchValue}
              placeholder="Ad, slug veya SKU ara"
              className="h-11 w-full rounded-xl border border-white/12 bg-black/20 pr-4 pl-10 text-sm outline-none placeholder:text-muted-foreground focus:border-cyan"
            />
          </label>
          <select
            name="status"
            defaultValue={status}
            className="h-11 rounded-xl border border-white/12 bg-[#11151a] px-3 text-sm"
            aria-label="Durum filtresi"
          >
            <option value="">Tüm durumlar</option>
            <option value="active">Yayında</option>
            <option value="draft">Taslak</option>
            <option value="scheduled">Planlandı</option>
            <option value="archived">Arşiv</option>
          </select>
          <select
            name="kategori"
            defaultValue={category}
            className="h-11 rounded-xl border border-white/12 bg-[#11151a] px-3 text-sm"
            aria-label="Kategori filtresi"
          >
            <option value="">Tüm kategoriler</option>
            {overview.categories.map((item) => (
              <option key={item.id} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            name="stok"
            defaultValue={stock}
            className="h-11 rounded-xl border border-white/12 bg-[#11151a] px-3 text-sm"
            aria-label="Stok filtresi"
          >
            <option value="">Tüm stok</option>
            <option value="in">Stokta</option>
            <option value="low">Düşük stok</option>
            <option value="out">Tükendi</option>
          </select>
          <select
            name="oneCikan"
            defaultValue={featured}
            className="h-11 rounded-xl border border-white/12 bg-[#11151a] px-3 text-sm"
            aria-label="Öne çıkan filtresi"
          >
            <option value="">Öne çıkan: hepsi</option>
            <option value="1">Yalnızca öne çıkan</option>
          </select>
          <select
            name="sira"
            defaultValue={sort}
            className="h-11 rounded-xl border border-white/12 bg-[#11151a] px-3 text-sm"
            aria-label="Sıralama"
          >
            <option value="updated">Son güncelleme</option>
            <option value="name">Ad</option>
            <option value="price">Fiyat</option>
            <option value="stock">Stok</option>
          </select>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-5 text-sm font-semibold hover:bg-[#232b34] md:col-span-3 xl:col-span-6"
          >
            <Settings2 className="size-4" aria-hidden="true" />
            Filtrele
          </button>
        </form>
      </section>

      {products.length ? (
        <ProductCatalogTable
          products={products}
          categories={overview.categories}
          allowDemoImport={demoImportAllowed}
        />
      ) : (
        <div className="rounded-3xl border border-white/10 bg-card px-6 py-16 text-center">
          <PackageOpen className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 font-heading text-xl font-medium">
            {overview.products.length ? "Eşleşen ürün yok" : "Henüz ürün yok"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {overview.mode === "unconfigured"
              ? "Önce kalıcı veritabanını bağlayın veya geliştirme demo modunda çalışın."
              : "Filtreleri temizleyin veya ilk ürün kaydınızı oluşturun."}
          </p>
          <Link
            href="/admin/urunler/yeni"
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-cyan px-5 text-sm font-bold text-ink"
          >
            Yeni ürün
          </Link>
        </div>
      )}
    </>
  );
}

function isProductStatus(value: string | undefined): value is ProductStatus {
  return (
    value === "draft" ||
    value === "scheduled" ||
    value === "active" ||
    value === "archived"
  );
}
