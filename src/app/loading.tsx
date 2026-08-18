import { FormSignal } from "@/components/brand/form-signal";

export default function RootLoading() {
  return (
    <div
      className="bg-background fixed inset-0 z-[90] grid place-items-center"
      role="status"
      aria-live="polite"
      aria-label="Sayfa yükleniyor"
    >
      <div className="text-center">
        <FormSignal spinning tone="dark" className="mx-auto size-10" />
        <p className="text-steel mt-4 text-xs font-bold tracking-[0.18em] uppercase">
          Katmanlar hazırlanıyor
        </p>
      </div>
    </div>
  );
}
