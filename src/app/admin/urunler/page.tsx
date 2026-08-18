import Link from "next/link";
import type { Metadata } from "next";
import {
  FileSpreadsheet,
  FlaskConical,
  ImagePlus,
  PackageOpen,
  Plus,
  Search,
  Settings2,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { ProductActions } from "@/components/admin/product-actions";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminCatalogOverview } from "@/domain/catalog/admin-repository";
import type { ProductStatus } from "@/domain/catalog/types";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Ürün yönetimi",
};

const statusLabels: Record<ProductStatus, string> = {
  active: "Aktif",
  draft: "Taslak",
  archived: "Arşiv",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
  }>;
}) {
  const query = await searchParams;
  const searchValue = (Array.isArray(query.q) ? query.q[0] : query.q)?.trim() ?? "";
  const rawStatus = Array.isArray(query.status)
    ? query.status[0]
    : query.status;
  const status =
    rawStatus === "active" || rawStatus === "draft" || rawStatus === "archived"
      ? rawStatus
      : "";
  const overview = await getAdminCatalogOverview();
  const normalizedSearch = searchValue.toLocaleLowerCase("tr-TR");
  const products = overview.products.filter((product) => {
    const matchesSearch =
      !normalizedSearch ||
      `${product.name} ${product.slug} ${product.sku}`
        .toLocaleLowerCase("tr-TR")
        .includes(normalizedSearch);
    const matchesStatus = !status || product.status === status;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Katalog / Ürünler"
        title="Ürün yönetimi"
        description="Ürün, varyant, stok, yayın ve SEO kayıtlarını tek yerde yönetin. Liste gerçek katalog kaynağından okunur."
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
            <strong>Demo katalog listesi:</strong> Buradaki değişiklikler yalnızca
            yerel geliştirme dosyasına yazılır. Gerçek mağaza siparişi veya canlı
            Supabase verisi değildir.
          </p>
        </div>
      ) : null}

      <section className="mb-5 rounded-3xl border border-white/10 bg-card p-4">
        <form
          action="/admin/urunler"
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_13rem_auto]"
        >
          <label className="relative">
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
          <label>
            <span className="sr-only">Durum filtresi</span>
            <select
              name="status"
              defaultValue={status}
              className="h-11 w-full rounded-xl border border-white/12 bg-[#11151a] px-3 text-sm outline-none focus:border-cyan"
            >
              <option value="">Tüm durumlar</option>
              <option value="active">Aktif</option>
              <option value="draft">Taslak</option>
              <option value="archived">Arşiv</option>
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-secondary px-5 text-sm font-semibold hover:bg-[#232b34]"
          >
            <Settings2 className="size-4" aria-hidden="true" />
            Filtrele
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-card">
        {products.length ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-white/[0.025]">
                <TableHead className="px-5">Ürün</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Fiyat</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Varyant</TableHead>
                <TableHead className="min-w-72 pr-5">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="px-5 py-4">
                    <div className="max-w-72">
                      <Link
                        href={`/admin/urunler/${product.id}`}
                        className="font-semibold whitespace-normal hover:text-cyan"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 truncate font-mono text-[0.68rem] text-muted-foreground">
                        {product.sku} · /{product.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "active"
                          ? "default"
                          : product.status === "archived"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {statusLabels[product.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular font-medium">
                    {formatMoney(product.priceMinor)}
                  </TableCell>
                  <TableCell className="tabular">
                    <span
                      className={
                        product.inventoryQuantity <= 5
                          ? "font-semibold text-warm"
                          : ""
                      }
                    >
                      {product.inventoryQuantity}
                    </span>
                  </TableCell>
                  <TableCell className="tabular">
                    {product.variants.length}
                  </TableCell>
                  <TableCell className="pr-5">
                    <ProductActions
                      id={product.id}
                      name={product.name}
                      status={product.status}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-6 py-16 text-center">
            <PackageOpen
              className="mx-auto size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <h2 className="mt-4 font-heading text-xl font-medium">
              Eşleşen ürün yok
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Filtreleri temizleyin veya ilk ürün kaydınızı oluşturun.
            </p>
          </div>
        )}
      </section>

      <section
        aria-label="Planlanan toplu araçlar"
        className="mt-6 grid gap-4 md:grid-cols-3"
      >
        {[
          {
            icon: FileSpreadsheet,
            title: "CSV içe aktarma",
            status: "Planlandı",
            description:
              "Şema eşleme, satır önizleme ve geri alma olmadan etkinleştirilmeyecek.",
          },
          {
            icon: Settings2,
            title: "Toplu düzenleme",
            status: "Planlandı",
            description:
              "Seçim, değişiklik özeti ve atomik işlem tasarımı sonraki katalog iterasyonunda.",
          },
          {
            icon: ImagePlus,
            title: "Medya yükleme",
            status: "URL ile sınırlı",
            description:
              "Bu fazda yalnızca doğrulanmış medya URL’leri ve sıralama desteklenir.",
          },
        ].map(({ icon: Icon, title, status: itemStatus, description }) => (
          <article
            key={title}
            className="rounded-2xl border border-dashed border-white/12 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
              <span className="text-[0.62rem] font-bold tracking-[0.12em] text-warm uppercase">
                {itemStatus}
              </span>
            </div>
            <h2 className="mt-5 text-sm font-semibold">{title}</h2>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          </article>
        ))}
      </section>
    </>
  );
}
