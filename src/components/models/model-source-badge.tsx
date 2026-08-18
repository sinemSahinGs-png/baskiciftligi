import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export type ModelSource = "owned" | "licensed" | "thingiverse";

const labels: Record<ModelSource, string> = {
  owned: siteConfig.collectionLabel,
  licensed: "Lisanslı tasarımcı",
  thingiverse: "Thingiverse",
};

export function ModelSourceBadge({
  source,
  className,
}: {
  source: ModelSource;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold",
        source === "thingiverse"
          ? "bg-neutral text-dark-text"
          : source === "licensed"
            ? "bg-coral text-light-text"
            : "bg-cobalt text-light-text",
        className,
      )}
    >
      {labels[source]}
    </span>
  );
}
