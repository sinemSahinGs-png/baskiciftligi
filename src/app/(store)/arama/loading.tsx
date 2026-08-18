import { FormSignalLoader } from "@/components/motion/form-signal-loader";

export default function SearchLoading() {
  return (
    <main
      id="ana-icerik"
      aria-busy="true"
      aria-label="Arama sonuçları yükleniyor"
      className="shell py-16"
    >
      <span className="sr-only">Arama sonuçları yükleniyor…</span>
      <FormSignalLoader
        label="Arama sonuçları yükleniyor"
        tone="dark"
        className="mb-8"
      />
      <div className="h-3 w-32 animate-pulse rounded-full bg-cyan/20" />
      <div className="mt-6 h-16 max-w-2xl animate-pulse rounded-2xl bg-white/[0.06]" />
      <div className="mt-9 h-16 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="aspect-[4/5] animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>
    </main>
  );
}
