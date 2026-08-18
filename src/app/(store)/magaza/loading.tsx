export default function StoreLoading() {
  return (
    <main id="ana-icerik" aria-busy="true" aria-label="Mağaza yükleniyor">
      <span className="sr-only">Mağaza yükleniyor…</span>
      <div className="border-b border-hairline py-12">
        <div className="shell">
          <div className="h-3 w-32 rounded bg-muted" />
          <div className="mt-6 h-12 max-w-3xl rounded-md bg-muted" />
          <div className="mt-4 h-5 max-w-xl rounded bg-muted" />
        </div>
      </div>
      <div className="shell py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="aspect-[4/5] rounded-xl bg-muted"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
