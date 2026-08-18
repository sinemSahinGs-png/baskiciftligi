import Link from "next/link";
import type { Metadata } from "next";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CircleDot,
  DraftingCompass,
  Tags,
} from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { getAdminCatalogSummary } from "@/domain/catalog/admin-repository";

export const metadata: Metadata = {
  title: "Yönetim merkezi",
};

export default async function AdminDashboardPage() {
  const summary = await getAdminCatalogSummary();
  const metrics = [
    {
      label: "Toplam ürün",
      value: summary.productCount,
      detail: `${summary.activeProductCount} aktif`,
      icon: Boxes,
    },
    {
      label: "Taslak ürün",
      value: summary.draftProductCount,
      detail: "Yayın öncesi kayıt",
      icon: DraftingCompass,
    },
    {
      label: "Kategoriler",
      value: summary.categoryCount,
      detail: "Katalog navigasyonu",
      icon: Tags,
    },
    {
      label: "Düşük stok varyantı",
      value: summary.lowStockVariantCount,
      detail: "5 ve altı etkin stok",
      icon: AlertTriangle,
    },
  ] as const;

  return (
    <>
      <AdminPageHeader
        eyebrow="Yönetim merkezi"
        title="Dashboard"
        description="Katalog için doğrulanmış operasyon özeti. Sipariş, gelir ve müşteri metrikleri ilgili fazlar açılmadan hesaplanmaz veya tahmin edilmez."
        actions={
          <>
            <Link
              href="/admin/yayina-alma"
              className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground"
            >
              Yayına alma
            </Link>
            <Link
              href="/admin/kategoriler"
              className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground"
            >
              Kategoriler
            </Link>
            <Link
              href="/admin/urunler/yeni"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cyan px-5 text-sm font-bold text-ink transition-colors hover:bg-[#63e2ff]"
            >
              Yeni ürün
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        }
      />

      <section aria-label="Katalog özeti" className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {metrics.map(({ label, value, detail, icon: Icon }) => (
          <article
            key={label}
            className="rounded-3xl border border-white/10 bg-card p-6"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase">
                {label}
              </p>
              <span className="grid size-9 place-items-center rounded-xl bg-white/[0.05] text-cyan">
                <Icon className="size-4" aria-hidden="true" />
              </span>
            </div>
            <p className="tabular mt-7 font-heading text-4xl font-medium tracking-[-0.05em]">
              {value}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
          </article>
        ))}
      </section>

      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <section className="rounded-3xl border border-white/10 bg-card p-6 sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[0.65rem] font-bold tracking-[0.14em] text-cyan uppercase">
                Faz 1 çalışma alanı
              </p>
              <h2 className="mt-3 font-heading text-2xl font-medium">
                Katalog yönetimi hazır
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Ürünler; varyant, stok, kategori, koleksiyon, SEO ve yayın
                alanlarıyla yönetilebilir. Supabase bağlı ortamda tüm yazmalar
                oturum kullanıcısı ve RLS yönetici politikalarıyla sınırlandırılır.
              </p>
            </div>
            <CircleDot className="size-5 shrink-0 text-emerald-300" aria-hidden="true" />
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/admin/urunler"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold hover:bg-[#232b34]"
            >
              Ürünleri yönet
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/kategoriler"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              Kategori düzeni
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-card p-6">
          <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
            Veri kapsamı
          </p>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
              <dt className="text-muted-foreground">Aktif katalog</dt>
              <dd className="font-semibold">{summary.activeProductCount} ürün</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-b border-white/8 pb-4">
              <dt className="text-muted-foreground">Arşiv</dt>
              <dd className="font-semibold">
                {summary.archivedProductCount} ürün
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted-foreground">Ticari metrikler</dt>
              <dd className="font-semibold text-warm">Henüz bağlı değil</dd>
            </div>
          </dl>
        </section>
      </div>
    </>
  );
}
