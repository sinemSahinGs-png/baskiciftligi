import { FormSignalLoader } from "@/components/motion/form-signal-loader";

export default function StoreLoading() {
  return (
    <main id="ana-icerik" aria-busy="true" aria-label="Mağaza yükleniyor">
      <span className="sr-only">Mağaza yükleniyor…</span>
      <FormSignalLoader
        label="Mağaza yükleniyor"
        tone="dark"
        className="pt-10"
      />
      <div className="border-b border-hairline py-16">
        <div className="shell">
          <div className="h-3 w-32 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-14 max-w-3xl animate-pulse rounded-xl bg-muted" />
          <div className="mt-4 h-6 max-w-xl animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="shell py-12">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="aspect-[4/5] animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
