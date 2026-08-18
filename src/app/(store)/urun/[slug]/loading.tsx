export default function ProductLoading() {
  return (
    <main
      id="ana-icerik"
      aria-busy="true"
      aria-label="Ürün yükleniyor"
      className="shell py-10"
    >
      <span className="sr-only">Ürün yükleniyor…</span>
      <div className="h-4 w-64 rounded bg-muted" />
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="aspect-[4/5] rounded-xl bg-muted" />
        <div className="space-y-5 pt-4">
          <div className="h-6 w-28 rounded bg-muted" />
          <div className="h-16 rounded-xl bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
          <div className="h-40 rounded-xl bg-muted" />
          <div className="h-13 rounded-md bg-muted" />
        </div>
      </div>
    </main>
  );
}
