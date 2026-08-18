"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  bulkProductsAction,
  importDemoProductsAction,
} from "@/app/admin/actions";
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
import type { AdminCategory } from "@/domain/catalog/admin-types";
import type { Product } from "@/domain/catalog/types";
import { publicationLabel } from "@/lib/catalog/visibility";
import { formatMoney } from "@/lib/money";

interface ProductCatalogTableProps {
  products: Product[];
  categories: AdminCategory[];
  allowDemoImport: boolean;
}

export function ProductCatalogTable({
  products,
  categories,
  allowDemoImport,
}: ProductCatalogTableProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();
  const [categorySlug, setCategorySlug] = useState(categories[0]?.slug ?? "");

  const allSelected = products.length > 0 && selected.length === products.length;

  const selectedProducts = useMemo(
    () => products.filter((product) => selected.includes(product.id)),
    [products, selected],
  );

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function runBulk(
    action: "publish" | "unpublish" | "archive" | "feature" | "unfeature" | "assign-category",
  ) {
    if (!selected.length) {
      toast.error("Önce ürün seçin.");
      return;
    }

    startTransition(async () => {
      const result = await bulkProductsAction({
        ids: selected,
        action,
        categorySlug: action === "assign-category" ? categorySlug : undefined,
      });
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setSelected([]);
      router.refresh();
    });
  }

  function importDemo() {
    if (
      !window.confirm(
        "Demo ürünler mevcut gerçek kayıtların üzerine yazılmaz. Devam edilsin mi?",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await importDemoProductsAction(true);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-card p-3">
        <span className="text-xs text-muted-foreground">
          {selected.length} seçili
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() => runBulk("publish")}
          className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold"
        >
          Yayınla
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => runBulk("unpublish")}
          className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold"
        >
          Yayından al
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => runBulk("archive")}
          className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold"
        >
          Arşivle
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => runBulk("feature")}
          className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold"
        >
          Öne çıkar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => runBulk("unfeature")}
          className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold"
        >
          Öne çıkarmayı kaldır
        </button>
        <select
          value={categorySlug}
          onChange={(event) => setCategorySlug(event.target.value)}
          className="h-8 rounded-full border border-white/12 bg-[#11151a] px-3 text-xs"
          aria-label="Toplu kategori"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !categorySlug}
          onClick={() => runBulk("assign-category")}
          className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold"
        >
          Kategori ata
        </button>
        {allowDemoImport ? (
          <button
            type="button"
            disabled={pending}
            onClick={importDemo}
            className="rounded-full border border-warm/30 px-3 py-1.5 text-xs font-semibold text-warm"
          >
            Demo ürünleri içe aktar
          </button>
        ) : null}
        <Link
          href="/admin/urunler/csv"
          className="rounded-full border border-white/12 px-3 py-1.5 text-xs font-semibold"
        >
          CSV
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-white/[0.025]">
              <TableHead className="w-12 px-4">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() =>
                    setSelected(allSelected ? [] : products.map((product) => product.id))
                  }
                  aria-label="Tümünü seç"
                />
              </TableHead>
              <TableHead>Ürün</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Üretim</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="min-w-64 pr-5">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="px-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(product.id)}
                    onChange={() => toggle(product.id)}
                    aria-label={`${product.name} seç`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="size-12 overflow-hidden rounded-lg border border-white/10 bg-black/30">
                      {product.media[0]?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.media[0].url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/admin/urunler/${product.id}`}
                        className="font-semibold hover:text-cyan"
                      >
                        {product.name}
                      </Link>
                      <p className="truncate font-mono text-[0.65rem] text-muted-foreground">
                        /{product.slug}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs">{product.sku}</TableCell>
                <TableCell className="text-xs">
                  {product.categorySlugs[0] ?? "—"}
                </TableCell>
                <TableCell className="tabular">{formatMoney(product.priceMinor)}</TableCell>
                <TableCell className="tabular">{product.inventoryQuantity}</TableCell>
                <TableCell className="text-xs">
                  {product.kind === "ready_stock"
                    ? "Hazır stok"
                    : product.kind === "hybrid"
                      ? "Hibrit"
                      : "Sipariş üzerine"}
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
                    {publicationLabel(product.status)}
                  </Badge>
                  {product.featured ? (
                    <span className="mt-1 block text-[0.6rem] text-cyan">Öne çıkan</span>
                  ) : null}
                </TableCell>
                <TableCell className="pr-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/urunler/${product.id}/onizleme`}
                      className="text-xs font-semibold text-cyan"
                    >
                      Önizle
                    </Link>
                    <ProductActions
                      id={product.id}
                      name={product.name}
                      status={product.status}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {selectedProducts.length ? (
        <p className="sr-only">{selectedProducts.length} ürün seçildi.</p>
      ) : null}
    </div>
  );
}
