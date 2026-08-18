import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, PackageCheck } from "lucide-react";

import { getAdminProductById } from "@/domain/catalog/admin-repository";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Ürün ön izleme",
  robots: { index: false, follow: false },
};

export default async function ProductPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getAdminProductById(id);

  if (!product) {
    notFound();
  }

  const primaryMedia = [...product.media].sort(
    (a, b) => a.position - b.position,
  )[0];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-cyan/25 bg-cyan/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Eye className="mt-0.5 size-5 shrink-0 text-cyan" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Yönetici ön izlemesi</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Bu görünüm mağaza rotası değildir ve yalnızca yetkili yönetim
              oturumunda açılır. Sepet veya ödeme işlevi içermez.
            </p>
          </div>
        </div>
        <Link
          href={`/admin/urunler/${product.id}`}
          className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Düzenlemeye dön
        </Link>
      </div>

      <article className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-card lg:grid-cols-2">
        <div
          role="img"
          aria-label={primaryMedia?.alt ?? `${product.name} ürün görseli`}
          className="min-h-[24rem] bg-[radial-gradient(circle_at_35%_25%,rgba(33,212,253,.16),transparent_38%),linear-gradient(145deg,#151b21,#0b0e12)] bg-cover bg-center lg:min-h-[44rem]"
          style={
            primaryMedia
              ? { backgroundImage: `url("${primaryMedia.url}")` }
              : undefined
          }
        >
          {!primaryMedia ? (
            <div className="grid h-full min-h-[24rem] place-items-center text-sm text-muted-foreground">
              Medya URL’si eklenmedi
            </div>
          ) : null}
        </div>

        <div className="flex flex-col p-7 sm:p-10 lg:p-14">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/12 px-3 py-1 text-[0.65rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
              {product.status === "active"
                ? "Aktif"
                : product.status === "archived"
                  ? "Arşiv"
                  : "Taslak"}
            </span>
            {product.featured ? (
              <span className="rounded-full bg-cyan px-3 py-1 text-[0.65rem] font-bold tracking-[0.12em] text-ink uppercase">
                Öne çıkan
              </span>
            ) : null}
          </div>

          <h1 className="mt-7 font-heading text-4xl leading-tight font-medium tracking-[-0.055em] sm:text-5xl">
            {product.name}
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            {product.shortDescription}
          </p>
          <p className="mt-7 font-heading text-3xl text-cyan">
            {formatMoney(product.priceMinor)}
          </p>

          <div className="mt-8 border-t border-white/10 pt-7">
            <h2 className="text-sm font-semibold">Varyantlar</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.variants.map((variant) => (
                <span
                  key={variant.id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-2 text-xs"
                >
                  {variant.colorHex ? (
                    <span
                      className="size-3 rounded-full border border-white/20"
                      style={{ backgroundColor: variant.colorHex }}
                      aria-hidden="true"
                    />
                  ) : null}
                  {variant.name}
                  <span className="text-muted-foreground">
                    · {variant.inventoryQuantity} stok
                  </span>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-7">
            <h2 className="text-sm font-semibold">Ürün açıklaması</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {product.description}
            </p>
          </div>

          <div className="mt-auto pt-10">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs leading-5 text-muted-foreground">
              <PackageCheck
                className="size-5 shrink-0 text-cyan"
                aria-hidden="true"
              />
              {product.kind === "ready_stock"
                ? "Hazır stok ürünü"
                : `${product.productionLeadTimeDays.min}–${product.productionLeadTimeDays.max} iş günü üretim süresi`}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
