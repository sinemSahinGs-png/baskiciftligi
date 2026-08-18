import type { Route } from "next";
import Link from "next/link";
import { PackageOpen } from "lucide-react";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { EmptyState } from "@/components/feedback/empty-state";
import { STORE_EMPTY_COPY } from "@/lib/catalog/empty-store-copy";

export function EmptyCatalogState({
  adminHref = false,
}: {
  adminHref?: boolean;
}) {
  if (adminHref) {
    return (
      <EmptyState
        icon={<PackageOpen className="size-6" aria-hidden="true" />}
        title="Vitrinde henüz yayınlanmış ürün yok"
        description="Taslak veya arşiv kayıtları mağazada gösterilmez. İlk gerçek ürün yayınlandığında burada görünür; demo katalog otomatik doldurulmaz."
        action={{ href: "/admin/urunler/yeni", label: "İlk ürünü oluştur" }}
      />
    );
  }

  return (
    <section
      data-empty-store=""
      className="relative overflow-hidden rounded-3xl border border-hairline bg-cobalt px-6 py-10 text-light-text sm:px-10 sm:py-12"
    >
      <FoundryGrid variant="fade" className="opacity-70" />
      <div className="relative max-w-2xl">
        <p className="text-sm text-white/75">Baskı Çiftliği koleksiyonu</p>
        <h2 className="font-heading mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
          {STORE_EMPTY_COPY.title}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-white/85">
          {STORE_EMPTY_COPY.description}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {STORE_EMPTY_COPY.actions.map((action, index) => (
            <Link
              key={action.href}
              href={action.href as Route}
              className={
                index === 0
                  ? "inline-flex min-h-11 items-center justify-center rounded-md bg-warm px-5 text-sm font-semibold text-ink"
                  : "inline-flex min-h-11 items-center justify-center rounded-md border border-white/40 px-5 text-sm font-semibold text-light-text"
              }
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
