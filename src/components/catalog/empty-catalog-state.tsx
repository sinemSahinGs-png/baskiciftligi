import type { Route } from "next";
import Link from "next/link";
import { PackageOpen } from "lucide-react";

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
    <section data-empty-store="" className="store-empty">
      <p className="store-intro-kicker">Baskı Çiftliği koleksiyonu</p>
      <h2 className="mt-3 font-heading text-3xl font-bold tracking-[-0.04em]">
        {STORE_EMPTY_COPY.title}
      </h2>
      <p className="mt-4 max-w-xl text-base leading-7 text-[color:var(--store-muted-dark)]">
        {STORE_EMPTY_COPY.description}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {STORE_EMPTY_COPY.actions.map((action, index) => (
          <Link
            key={action.href}
            href={action.href as Route}
            className={
              index === 0
                ? "store-btn-primary"
                : "inline-flex min-h-11 items-center justify-center border border-[color:var(--store-line-dark)] px-5 text-sm font-semibold"
            }
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
