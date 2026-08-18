"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { importCatalogCsvAction } from "@/app/admin/actions";
import { parseCatalogCsv } from "@/lib/catalog/csv";

export function CatalogCsvPanel({ initialCsv }: { initialCsv: string }) {
  const [text, setText] = useState("");
  const [committed, setCommitted] = useState(false);
  const [pending, startTransition] = useTransition();
  const preview = useMemo(() => parseCatalogCsv(text), [text]);

  function commit() {
    if (preview.errors.length || !preview.rows.length) {
      toast.error("Önce geçerli bir CSV önizlemesi oluşturun.");
      return;
    }

    startTransition(async () => {
      const result = await importCatalogCsvAction(preview.rows);
      if (result.status === "error") {
        toast.error(result.message);
        return;
      }
      setCommitted(true);
      toast.success(result.message);
    });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="rounded-3xl border border-white/10 bg-card p-5">
        <h2 className="font-heading text-xl">Dışa aktarma</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Mevcut katalog anlık görüntüsü. Fiyatlar kuruş cinsinden tam sayıdır.
        </p>
        <textarea
          readOnly
          value={initialCsv}
          className="mt-4 min-h-64 w-full rounded-2xl border border-white/10 bg-black/20 p-3 font-mono text-xs"
        />
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(initialCsv)}`}
          download="baski-ciftligi-katalog.csv"
          className="mt-3 inline-flex min-h-10 items-center rounded-full bg-cyan px-4 text-sm font-bold text-ink"
        >
          CSV indir
        </a>
      </section>
      <section className="rounded-3xl border border-white/10 bg-card p-5">
        <h2 className="font-heading text-xl">İçe aktarma önizlemesi</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Satırlar doğrulanmadan kaydedilmez. Eşleme anahtarı SKU’dur.
        </p>
        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setCommitted(false);
          }}
          className="mt-4 min-h-48 w-full rounded-2xl border border-white/10 bg-black/20 p-3 font-mono text-xs"
          placeholder="name,slug,sku,price_minor,status"
        />
        {preview.errors.length ? (
          <ul className="mt-3 space-y-1 text-xs text-destructive">
            {preview.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            {preview.rows.length} satır geçerli.
          </p>
        )}
        <button
          type="button"
          disabled={pending || committed || preview.errors.length > 0}
          onClick={commit}
          className="mt-4 inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold disabled:opacity-40"
        >
          Önizlemeyi kaydet
        </button>
      </section>
    </div>
  );
}
