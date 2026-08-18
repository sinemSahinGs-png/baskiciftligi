import { FormSignal } from "@/components/brand/form-signal";
import { cn } from "@/lib/utils";

export function FormSignalLoader({
  label,
  className,
  tone = "dark",
}: {
  label: string;
  className?: string;
  tone?: "light" | "dark" | "lime";
}) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex items-center justify-center gap-3", className)}
    >
      <FormSignal spinning tone={tone} className="size-6" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
