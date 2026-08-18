import { cn } from "@/lib/utils";
import { calculateDiscountPercentage, formatMoney } from "@/lib/money";

interface PriceDisplayProps {
  priceMinor: number;
  compareAtPriceMinor?: number | null;
  currency?: "TRY";
  className?: string;
}

export function PriceDisplay({
  priceMinor,
  compareAtPriceMinor,
  currency = "TRY",
  className,
}: PriceDisplayProps) {
  const discount = calculateDiscountPercentage(priceMinor, compareAtPriceMinor ?? null);

  return (
    <div className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className="type-price text-[1.05rem] sm:text-[1.12rem]">
        {formatMoney(priceMinor, currency)}
      </span>
      {compareAtPriceMinor && compareAtPriceMinor > priceMinor ? (
        <>
          <span className="tabular text-sm text-ink-muted line-through">
            {formatMoney(compareAtPriceMinor, currency)}
          </span>
          {discount ? (
            <span className="text-xs font-semibold text-brand">%{discount}</span>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
