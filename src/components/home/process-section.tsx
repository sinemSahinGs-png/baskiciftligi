import type { Route } from "next";
import Link from "next/link";

import {
  homepageProcessCopy,
  homepageProcessSteps,
} from "@/domain/home/homepage";

export function ProcessSection() {
  return (
    <section
      id="nasil-calisir"
      data-process-section
      data-process-pinned="false"
      className="home-section"
    >
      <div className="home-shell">
        <p className="text-[0.8125rem] font-semibold tracking-[0.14em] text-cyan uppercase">
          {homepageProcessCopy.eyebrow}
        </p>
        <h2 className="home-title home-mask-reveal mt-2">{homepageProcessCopy.title}</h2>
        <p className="home-lede">{homepageProcessCopy.description}</p>

        <div className="relative mt-6">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-3 bottom-3 left-[1.15rem] w-px bg-white/12 sm:hidden"
          >
            <span className="home-process-fill absolute inset-x-0 top-0 h-full origin-top bg-cyan" />
          </span>
          <ol
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3"
            data-process-mobile
            data-process-desktop
          >
            {homepageProcessSteps.map((step) => (
              <li
                key={step.number}
                data-process-step={step.number}
                data-process-active="true"
                className="relative pl-10 sm:pl-0"
              >
                <p className="font-heading text-4xl leading-none font-bold tracking-[-0.06em] text-cyan">
                  {step.number}
                </p>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 72 8"
                  className="mt-3 h-2 w-16 text-orange"
                >
                  <path
                    d="M1 6 C18 6 18 2 36 2 S54 6 71 2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="home-pipeline-line"
                  />
                </svg>
                <h3 className="mt-3 font-heading text-xl font-semibold tracking-[-0.03em]">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-base leading-7 text-white/80">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={"/magaza" as Route}
            className="home-cta-press inline-flex min-h-11 items-center rounded-xl border border-white/18 px-5 text-[0.9375rem] font-semibold"
          >
            {homepageProcessCopy.store}
          </Link>
          <Link
            href={"/model-yukle" as Route}
            className="home-cta-press inline-flex min-h-11 items-center rounded-xl bg-orange px-5 text-[0.9375rem] font-semibold text-midnight"
          >
            {homepageProcessCopy.upload}
          </Link>
        </div>
      </div>
    </section>
  );
}
