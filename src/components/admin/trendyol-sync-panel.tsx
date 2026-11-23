"use client";

import { useActionState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";

import { syncTrendyolAction } from "@/app/admin/entegrasyonlar/actions";
import { initialAdminActionState } from "@/app/admin/admin-state";
import { cn } from "@/lib/utils";

export function TrendyolSyncPanel({
  configured,
  flags,
}: {
  configured: boolean;
  flags: { sellerId: boolean; apiKey: boolean; apiSecret: boolean };
}) {
  const [state, formAction, pending] = useActionState(
    syncTrendyolAction,
    initialAdminActionState,
  );

  return (
    <section className="space-y-5 rounded-3xl border border-white/10 bg-card p-6">
      <div>
        <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
          Trendyol
        </p>
        <h2 className="mt-3 font-heading text-2xl font-medium">
          Ürün, fiyat ve stok çek
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Satıştaki onaylı ürünler OCTO kataloğuna yazılır. SKU veya barkod
          eşleşirse fiyat ve stok güncellenir. Her tıkta bir sayfa gelir;
          ürün bitene kadar tekrar bas.
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-3">
        {(
          [
            ["Satıcı ID", flags.sellerId],
            ["API Key", flags.apiKey],
            ["API Secret", flags.apiSecret],
          ] as const
        ).map(([name, present]) => (
          <li
            key={name}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm",
              present ? "border-emerald-400/30" : "border-white/10",
            )}
          >
            {name}: {present ? "tanımlı" : "yok"}
          </li>
        ))}
      </ul>

      {state.message ? (
        <p
          className={cn(
            "rounded-xl border p-3 text-sm",
            state.status === "error"
              ? "border-destructive/30 text-destructive"
              : "border-emerald-400/30 text-emerald-200",
          )}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <form action={formAction}>
        <input type="hidden" name="page" value={String(state.nextPage ?? 0)} />
        <button
          type="submit"
          disabled={pending || !configured}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cyan px-5 text-sm font-bold text-ink disabled:opacity-50"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="size-4" aria-hidden="true" />
          )}
          {pending
            ? "Çekiliyor…"
            : state.hasMore
              ? "Sonrakileri çek"
              : "Ürünleri çek"}
        </button>
      </form>
    </section>
  );
}
