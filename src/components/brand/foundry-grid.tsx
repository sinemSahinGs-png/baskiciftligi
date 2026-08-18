import { cn } from "@/lib/utils";

const variants = {
  blueprint: "grid-blueprint",
  manufacturing: "grid-manufacturing",
  perspective: "grid-perspective",
  measure: "grid-measure",
  contour: "grid-contour",
  corner: "grid-corner",
  fade: "grid-fade",
} as const;

export type FoundryGridVariant = keyof typeof variants;

export function FoundryGrid({
  variant,
  className,
}: {
  variant: FoundryGridVariant;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        variants[variant],
        className,
      )}
    />
  );
}
