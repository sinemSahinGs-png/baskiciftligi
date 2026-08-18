import { cn } from "@/lib/utils";

export const productionTimelineSteps = [
  "Ödeme alındı",
  "Model kontrolü",
  "Üretim sırası",
  "Baskıda",
  "Son işlem",
  "Kalite kontrol",
  "Kargoya hazır",
  "Kargoda",
  "Teslim edildi",
] as const;

interface OrderTimelineProps {
  currentStep?: number | null;
  note?: string;
}

export function OrderTimeline({
  currentStep = null,
  note = "Sipariş kaydı henüz bağlı değil. Aşamalar ödeme ve üretim altyapısı açıldığında bu siparişe göre ilerleyecek.",
}: OrderTimelineProps) {
  return (
    <section aria-labelledby="uretim-takibi-baslik" className="space-y-5">
      <div>
        <h2 id="uretim-takibi-baslik" className="font-heading text-2xl font-bold">
          Üretim takibi
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">{note}</p>
      </div>
      <ol className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {productionTimelineSteps.map((label, index) => {
          const isCurrent = currentStep === index;
          const isComplete =
            currentStep !== null && index < currentStep;

          return (
            <li
              key={label}
              className={cn(
                "relative rounded-lg border px-4 py-4",
                isCurrent
                  ? "border-cobalt bg-cobalt/8"
                  : isComplete
                    ? "border-lime/35 bg-lime/8"
                    : "border-hairline bg-paper",
              )}
            >
              <p className="tabular text-xs font-semibold text-ink-muted">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-1 text-sm font-semibold">{label}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
