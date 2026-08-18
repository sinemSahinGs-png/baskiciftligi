import { FormSignalLoader } from "@/components/motion/form-signal-loader";

export default function ProductLoading() {
  return (
    <main
      id="ana-icerik"
      aria-busy="true"
      aria-label="Ürün yükleniyor"
      className="shell py-10"
    >
      <span className="sr-only">Ürün yükleniyor…</span>
      <FormSignalLoader label="Ürün yükleniyor" tone="dark" className="mb-8" />
      <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="aspect-[4/5] animate-pulse rounded-xl bg-muted" />
        <div className="space-y-5 pt-4">
          <div className="h-6 w-28 animate-pulse rounded bg-clay" />
          <div className="h-16 animate-pulse rounded-xl bg-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
          <div className="h-40 animate-pulse rounded-xl bg-muted" />
          <div className="h-13 animate-pulse rounded-md bg-clay" />
        </div>
      </div>
    </main>
  );
}
