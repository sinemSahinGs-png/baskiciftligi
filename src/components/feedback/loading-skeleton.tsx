import { FormSignal } from "@/components/brand/form-signal";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({
  className,
  count = 1,
}: LoadingSkeletonProps) {
  return (
    <div role="status" aria-label="Yükleniyor" className="space-y-3">
      <span className="sr-only">İçerik yükleniyor…</span>
      <FormSignal spinning tone="dark" className="size-5" />
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className={cn("animate-pulse rounded-xl bg-muted", className)}
        />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      role="status"
      aria-label="Ürünler yükleniyor"
      className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4"
    >
      <span className="sr-only">Ürünler yükleniyor…</span>
      <FormSignal spinning tone="dark" className="col-span-full mx-auto size-6" />
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true" className="space-y-3">
          <div className="aspect-[4/5] min-h-0 animate-pulse overflow-hidden rounded-xl bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}
