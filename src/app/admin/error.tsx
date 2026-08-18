"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Octo Studio admin render]", error);
  }, [error]);

  return (
    <div className="grid min-h-[55vh] place-items-center">
      <section className="max-w-xl rounded-3xl border border-destructive/25 bg-card p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-medium">
          Yönetim verisi yüklenemedi
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Katalog bağlantısı, oturum yetkisi veya veri şeması doğrulanamadı.
          Ayrıntılar sunucu günlüğüne yazıldı; hassas hata içeriği bu ekranda
          gösterilmez.
        </p>
        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-muted-foreground">
            Hata referansı: {error.digest}
          </p>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-cyan px-5 text-sm font-bold text-ink"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Yeniden dene
          </button>
          <Link
            href="/admin"
            className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-5 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
