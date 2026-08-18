export default function SearchLoading() {
  return (
    <main
      id="ana-icerik"
      aria-busy="true"
      aria-label="Arama sonuçları yükleniyor"
      className="shell py-16"
    >
      <span className="sr-only">Arama sonuçları yükleniyor…</span>
      <div className="h-3 w-32 rounded bg-muted" />
      <div className="mt-6 h-12 max-w-2xl rounded-md bg-muted" />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="aspect-[4/5] rounded-xl bg-muted"
          />
        ))}
      </div>
    </main>
  );
}
