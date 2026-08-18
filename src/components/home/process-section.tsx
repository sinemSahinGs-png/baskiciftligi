"use client";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { PinnedStory } from "@/components/motion/pinned-story";
import { ProcessLayerLine } from "@/components/motion/process-layer-line";
import { RevealHeading } from "@/components/motion/reveal-words";
import { StaggerGrid } from "@/components/motion/stagger-grid";
import { useScrollMotion } from "@/components/motion/scroll-motion-provider";
import { homepageProcessSteps } from "@/domain/home/homepage";
import { cn } from "@/lib/utils";

function StepList({
  progress,
  pinned,
}: {
  progress: number;
  pinned: boolean;
}) {
  return (
    <ol className="relative grid gap-10 md:grid-cols-5 md:gap-6">
      {homepageProcessSteps.map((step, index) => {
        const on = pinned ? progress >= index / 4.2 : true;
        return (
          <li
            key={step.number}
            data-motion-item={on ? "visible" : "idle"}
            className={cn("motion-item relative", on ? "opacity-100" : "lg:opacity-45")}
          >
            <p
              className={cn(
                "font-heading text-5xl font-bold tracking-[-0.08em]",
                on ? "text-cyan" : "text-white/30",
              )}
            >
              {step.number}
            </p>
            <h3 className="mt-5 text-lg font-semibold sm:text-xl">{step.title}</h3>
            <p className="mt-3 max-w-[18ch] text-sm leading-6 text-white/80">
              {step.description}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

export function ProcessSection() {
  const { allowPinned, reduced } = useScrollMotion();
  const pinned = allowPinned && !reduced;

  return (
    <section className="atmosphere-cobalt relative overflow-hidden">
      <FoundryGrid variant="blueprint" className="opacity-40" />
      <div className="shell section-space">
        <RevealHeading
          text="Nasıl çalışır"
          className="section-title max-w-3xl text-light-text"
        />
        {pinned ? (
          <PinnedStory heightClassName="lg:h-[160vh]">
            {(progress) => (
              <div className="relative mt-12">
                <ProcessLayerLine progress={progress} />
                <StepList progress={progress} pinned />
              </div>
            )}
          </PinnedStory>
        ) : (
          <StaggerGrid className="relative mt-12">
            <ProcessLayerLine />
            <StepList progress={1} pinned={false} />
          </StaggerGrid>
        )}
      </div>
    </section>
  );
}
