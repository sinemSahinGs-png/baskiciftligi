"use client";

import Link from "next/link";

import { formatMoney } from "@/lib/money";
import type { AdminCategory } from "@/domain/catalog/admin-types";
import type { PublicationChecklistItem } from "@/lib/catalog/publication-checklist";
import type { ProductFormInput } from "@/lib/validation/catalog";

import { GuidedChecklist } from "./guided-checklist";
import { StepPanel } from "./form-primitives";
import { StorefrontPreviewCard } from "./storefront-preview-card";

type StepReviewProps = {
  values: ProductFormInput;
  categories: AdminCategory[];
  checklistItems: PublicationChecklistItem[];
  onChecklistSelect: (item: PublicationChecklistItem) => void;
  publishReady: boolean;
  errorMessage?: string;
  publishedSlug?: string | null;
  publishSuccess?: boolean;
};

export function StepReview({
  values,
  categories,
  checklistItems,
  onChecklistSelect,
  publishReady,
  errorMessage,
  publishedSlug,
  publishSuccess,
}: StepReviewProps) {
  const primarySlug = values.categorySlugs[0];
  const categoryName = categories.find((item) => item.slug === primarySlug)?.name;
  const cover =
    values.media.find((item) => item.role === "cover" || item.role === "primary") ??
    values.media[0];
  const priceMinor = values.priceMinor ?? 0;

  return (
    <StepPanel
      stepId="editor-step-5"
      active
      title="Kontrol ve yayınla"
      description="Son kontrolü yapın. Eksik bir maddeye tıklayarak ilgili adıma gidebilirsiniz."
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-white/10 bg-black/15 p-4 sm:p-5">
            <StorefrontPreviewCard
              values={values}
              categoryName={categoryName}
              large
            />
          </div>

          <dl className="grid gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Ürün</dt>
              <dd className="font-semibold">{values.name || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Fiyat</dt>
              <dd className="font-semibold text-cyan">
                {priceMinor > 0 ? formatMoney(priceMinor) : "Girilmedi"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Kategori</dt>
              <dd className="font-semibold">{categoryName || "Seçilmedi"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Stok / üretim</dt>
              <dd className="font-semibold">
                {values.kind === "ready_stock"
                  ? `${values.variants[0]?.inventoryQuantity ?? 0} adet stok`
                  : `${values.productionLeadTimeMinDays}–${values.productionLeadTimeMaxDays} gün`}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Kapak görseli</dt>
              <dd className="font-semibold">
                {cover?.url ? "Yüklendi" : "Eksik"}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Yayın kontrol listesi</h3>
            <GuidedChecklist items={checklistItems} onItemSelect={onChecklistSelect} />
          </div>

          {!publishReady ? (
            <p className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              Eksik maddelere tıklayarak ilgili alana gidin.
            </p>
          ) : (
            <p className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
              Ürün yayına hazır.
            </p>
          )}

          {errorMessage ? (
            <p
              className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              role="alert"
              data-testid="admin-form-error"
            >
              {errorMessage}
            </p>
          ) : null}

          {publishSuccess && publishedSlug ? (
            <div
              className="flex flex-wrap gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4"
              data-testid="publish-success-actions"
            >
              <Link
                href={`/urun/${publishedSlug}`}
                target="_blank"
                className="inline-flex min-h-11 items-center rounded-full bg-cyan px-4 text-xs font-bold text-ink"
              >
                Mağazada görüntüle
              </Link>
              <Link
                href="/admin/urunler/yeni"
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-xs font-semibold"
              >
                Yeni ürün ekle
              </Link>
              <button
                type="button"
                className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-xs font-semibold"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Ürünü düzenlemeye devam et
              </button>
            </div>
          ) : null}
        </div>

        <aside className="hidden xl:block">
          <StorefrontPreviewCard values={values} categoryName={categoryName} compact />
        </aside>
      </div>
    </StepPanel>
  );
}
