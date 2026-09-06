import type { Route } from "next";
import Link from "next/link";

import {
  homepageProcessCopy,
  homepageProcessSteps,
} from "@/domain/home/homepage";
import { cn } from "@/lib/utils";

const glyphs = ["▣", "◇", "⬡", "▸"] as const;

export function ProcessSection() {
  return (
    <section
      id="nasil-calisir"
      data-process-section
      data-process-pinned="false"
      className="bg-[#0e1418] text-light-text"
    >
      <div className="home-shell py-12 sm:py-16">
        <p className="text-xs font-semibold tracking-[0.14em] text-cyan uppercase">
          {homepageProcessCopy.eyebrow}
        </p>
        <h2 className="mt-3 font-heading text-[1.65rem] leading-[1.08] font-bold tracking-[-0.04em] sm:text-3xl">
          {homepageProcessCopy.title}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
          {homepageProcessCopy.description}
        </p>

        <ol
          className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          data-process-mobile
          data-process-desktop
        >
          {homepageProcessSteps.map((step, index) => (
            <li
              key={step.number}
              data-process-step={step.number}
              data-process-active="true"
              className="home-reveal-card rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-xl bg-cyan/15 font-heading text-lg text-cyan",
                  "home-step-glyph",
                )}
              >
                {glyphs[index]}
              </span>
              <p className="mt-4 text-xs font-semibold tracking-wide text-cyan">
                {step.number} · {step.kicker}
              </p>
              <h3 className="mt-1.5 font-heading text-lg font-semibold tracking-[-0.03em]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/70">{step.description}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={"/magaza" as Route}
            className="inline-flex min-h-11 items-center rounded-xl bg-coral px-5 text-sm font-semibold"
          >
            {homepageProcessCopy.store}
          </Link>
          <Link
            href={"/model-yukle" as Route}
            className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-5 text-sm font-semibold"
          >
            {homepageProcessCopy.upload}
          </Link>
        </div>
      </div>
    </section>
  );
}
