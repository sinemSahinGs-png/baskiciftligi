export default function StoreLoading() {
  return (
    <main
      id="ana-icerik"
      className="store-page"
      aria-busy="true"
      aria-label="Mağaza yükleniyor"
    >
      <span className="sr-only">Mağaza yükleniyor…</span>
      <div className="store-masthead py-5">
        <div className="shell">
          <div className="h-3 w-24 bg-white/15" />
          <div className="mt-5 h-12 max-w-xl bg-white/10" />
          <div className="mt-4 h-14 max-w-2xl bg-white/8" />
        </div>
      </div>
      <div className="shell py-6">
        <div className="store-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="aspect-[4/5] bg-[color:var(--store-paper-2,#e6e3dc)]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
