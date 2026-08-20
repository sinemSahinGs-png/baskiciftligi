"use client";

import { formatMoney } from "@/lib/money";

type DraftConflictBannerProps = {
  localPriceMinor: number | null;
  serverPriceMinor: number | null;
  localSavedAt: number;
  serverUpdatedAt: string;
  onUseServer: () => void;
  onUseLocal: () => void;
};

function formatTimestamp(value: number | string): string {
  const date = typeof value === "number" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function priceLabel(minor: number | null): string {
  if (minor === null || minor <= 0) {
    return "Boş";
  }
  return formatMoney(minor);
}

export function DraftConflictBanner({
  localPriceMinor,
  serverPriceMinor,
  localSavedAt,
  serverUpdatedAt,
  onUseServer,
  onUseLocal,
}: DraftConflictBannerProps) {
  return (
    <section
      className="mb-4 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 sm:p-5"
      role="alertdialog"
      aria-labelledby="draft-conflict-title"
      data-testid="draft-conflict-banner"
    >
      <h2 id="draft-conflict-title" className="font-heading text-lg font-medium">
        Bu tarayıcıdaki taslak ile sunucudaki kayıt farklı.
      </h2>
      <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Yerel taslak
          </p>
          <p className="mt-1 font-semibold">{priceLabel(localPriceMinor)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatTimestamp(localSavedAt)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Sunucu kaydı
          </p>
          <p className="mt-1 font-semibold">{priceLabel(serverPriceMinor)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatTimestamp(serverUpdatedAt)}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onUseServer}
          className="inline-flex min-h-11 items-center rounded-full border border-white/15 px-4 text-xs font-semibold"
        >
          Sunucudaki kaydı kullan
        </button>
        <button
          type="button"
          onClick={onUseLocal}
          className="inline-flex min-h-11 items-center rounded-full bg-cyan px-4 text-xs font-bold text-ink"
        >
          Yerel taslağı kullan
        </button>
      </div>
    </section>
  );
}
