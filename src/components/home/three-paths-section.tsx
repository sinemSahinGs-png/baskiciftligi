import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { SectionIntro } from "@/components/home/section-intro";
import { homepageJourneys } from "@/domain/home/homepage";
import { cn } from "@/lib/utils";

const order = ["/magaza", "/hazir-modeller", "/model-yukle"] as const;
const worlds = [
  "bg-cobalt text-light-text",
  "bg-deep-ink text-light-text",
  "bg-carbon text-light-text",
] as const;

export function ThreePathsSection() {
  const paths = order
    .map((href) => homepageJourneys.find((item) => item.href === href))
    .filter((item): item is (typeof homepageJourneys)[number] => Boolean(item));

  return (
    <section
      id="uc-uretim-yolu"
      data-journey-section
      className="atmosphere-optical pt-[clamp(2.25rem,4.8vw,4.25rem)] pb-12 sm:pb-16"
    >
      <div className="shell">
        <SectionIntro
          title="Üç üretim yolu"
          description="Mağaza, kütüphane veya kendi dosyan."
        />
        <div className="grid h-auto min-h-0 gap-3 lg:grid-cols-3 lg:gap-4">
          {paths.map((path, index) => (
            <Link
              key={path.id}
              href={path.href}
              data-journey-panel={String(index + 1).padStart(2, "0")}
              data-motion-item="visible"
              data-motion-state="visible"
              className={cn(
                "group relative min-h-[18rem] overflow-hidden rounded-xl p-6 opacity-100 sm:min-h-[20rem] sm:p-8",
                worlds[index],
              )}
            >
              {index === 0 ? <FoundryGrid variant="fade" className="opacity-50" /> : null}
              {index === 1 ? (
                <FoundryGrid variant="blueprint" className="opacity-80" />
              ) : null}
              {index === 2 ? <FoundryGrid variant="measure" className="opacity-70" /> : null}
              <p className="relative tabular text-4xl font-bold tracking-[-0.06em] text-cyan">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="relative mt-6 font-heading text-2xl font-bold tracking-[-0.04em] sm:text-3xl">
                {path.title}
              </h3>
              <p className="relative mt-3 max-w-sm text-sm leading-6 text-white/80">
                {path.description}
              </p>
              <span className="relative mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold">
                {path.cta}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
