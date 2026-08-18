import type { Route } from "next";
import Link from "next/link";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import {
  homepageProcessCopy,
  homepageProcessSteps,
} from "@/domain/home/homepage";
import { cn } from "@/lib/utils";

function ProductionStage({
  step,
}: {
  step: number;
}) {
  const layers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const printProgress = step >= 3 ? Math.min(1, (step - 2) / 2) : 0;

  return (
    <div
      className={cn(
        "relative h-40 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020] sm:h-44 lg:h-48",
      )}
      data-process-visual={String(step + 1).padStart(2, "0")}
    >
      <FoundryGrid variant="blueprint" className="opacity-50" />
      <svg
        viewBox="0 0 320 280"
        className="relative z-10 size-full"
        aria-hidden="true"
      >
        <line
          x1="28"
          y1="32"
          x2="28"
          y2="248"
          stroke="#30d5d2"
          strokeOpacity="0.28"
          strokeWidth="2"
        />
        <line
          x1="28"
          y1="32"
          x2="28"
          y2={32 + (step / 4) * 216}
          stroke="#30d5d2"
          strokeWidth="2"
        />
        <circle cx="28" cy={32 + (step / 4) * 216} r="4" fill="#30d5d2" />

        <g
          opacity={step === 0 ? 1 : 0.18}
          className="origin-center transition-opacity duration-500"
        >
          <rect x="46" y="46" width="44" height="54" rx="6" fill="none" stroke="#f6f3ec" strokeWidth="1.5" />
          <polygon points="118,48 148,72 118,96" fill="none" stroke="#7a42f4" strokeWidth="1.5" />
          <rect x="168" y="54" width="40" height="36" rx="3" fill="none" stroke="#ff6542" strokeWidth="1.5" strokeDasharray="4 3" />
        </g>

        <g transform="translate(160 142)">
          <polygon
            points="0,-46 40,-18 40,26 0,52 -40,26 -40,-18"
            fill="none"
            stroke="#f6f3ec"
            strokeWidth="1.6"
            className="transition-transform duration-700"
            style={{ transform: step === 1 ? "scale(1.08)" : "scale(1)" }}
          />
          <polygon
            points="0,-28 24,-10 24,18 0,34 -24,18 -24,-10"
            fill="none"
            stroke="#30d5d2"
            strokeOpacity="0.8"
            strokeWidth="1"
          />
        </g>

        {step === 1 ? (
          <g>
            <circle cx="64" cy="210" r="8" fill="#4054ff" />
            <circle cx="88" cy="210" r="8" fill="#ff6542" />
            <circle cx="112" cy="210" r="8" fill="#30d5d2" />
            <line x1="120" y1="96" x2="200" y2="96" stroke="#f6f3ec" strokeOpacity="0.55" />
            <line x1="200" y1="96" x2="200" y2="188" stroke="#f6f3ec" strokeOpacity="0.55" />
            <text x="126" y="90" fill="#30d5d2" fontSize="9">
              120 mm
            </text>
          </g>
        ) : null}

        {step === 2 ? (
          <g>
            <rect x="204" y="48" width="88" height="36" rx="6" fill="#111827" stroke="#30d5d2" />
            <text x="216" y="70" fill="#f6f3ec" fontSize="11">
              Teklif
            </text>
            <rect x="204" y="92" width="88" height="36" rx="6" fill="#111827" stroke="#ff6542" />
            <text x="214" y="114" fill="#ff6542" fontSize="10">
              Teknik inceleme
            </text>
            <rect x="204" y="136" width="88" height="28" rx="6" fill="#163028" stroke="#c8f55a" />
            <text x="222" y="154" fill="#c8f55a" fontSize="10">
              Teklif onay
            </text>
          </g>
        ) : null}

        {step >= 3 ? (
          <g>
            <rect
              x={88 + printProgress * 96}
              y="58"
              width="28"
              height="8"
              rx="2"
              fill="#30d5d2"
            />
            {layers.map((layer) => {
              const visible = printProgress > layer / layers.length;
              return (
                <rect
                  key={layer}
                  x="132"
                  y={188 - layer * 7}
                  width="56"
                  height="5"
                  fill="#f6f3ec"
                  opacity={visible ? 0.85 : 0.12}
                />
              );
            })}
            {step >= 3 ? (
              <rect
                x="118"
                y="92"
                width="84"
                height="2"
                fill="#c8f55a"
                opacity={step === 3 ? 0.9 : 0.2}
              />
            ) : null}
          </g>
        ) : null}

        {step === 4 ? (
          <g>
            <rect x="118" y="108" width="84" height="92" rx="6" fill="none" stroke="#f6f3ec" strokeWidth="1.5" />
            <line x1="118" y1="128" x2="202" y2="128" stroke="#f6f3ec" strokeOpacity="0.5" />
            <line x1="202" y1="154" x2="292" y2="154" stroke="#30d5d2" strokeWidth="2" />
          </g>
        ) : null}
      </svg>
      {step === 4 ? (
        <span className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-cyan/15 text-lime">
          <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M7.5 12.5 10.4 15.4 16.5 9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      ) : null}
      <p className="absolute bottom-3 left-4 font-heading text-sm tracking-[0.18em] text-cyan uppercase">
        {String(step + 1).padStart(2, "0")}
      </p>
    </div>
  );
}

function StepCopy({
  index,
  active,
}: {
  index: number;
  active: boolean;
}) {
  const step = homepageProcessSteps[index];
  if (!step) {
    return null;
  }

  return (
    <article
      data-process-step={step.number}
      data-process-active={active ? "true" : "false"}
      className={cn(
        "rounded-2xl border px-4 py-3 transition-colors duration-500",
        active
          ? "border-cyan/40 bg-white/6"
          : "border-white/10 bg-transparent",
      )}
    >
      <p className={cn("tabular text-xs font-bold", active ? "text-cyan" : "text-white/40")}>
        {step.number} · {step.kicker}
      </p>
      <h3 className="mt-1.5 font-heading text-lg font-semibold tracking-[-0.03em] lg:text-xl">
        {step.title}
      </h3>
      <p className="mt-1.5 max-w-[42ch] text-sm leading-5 text-white/75">
        {step.description}
      </p>
    </article>
  );
}

export function HowItWorksSectionV2() {
  return (
    <section
      id="nasil-calisir"
      data-process-section
      data-process-pinned="false"
      className="atmosphere-cobalt relative"
    >
      <FoundryGrid variant="blueprint" className="opacity-30" />
      <div className="shell relative py-12 sm:py-16">
        <p className="eyebrow text-light-text">{homepageProcessCopy.eyebrow}</p>
        <h2 className="section-title mt-3 max-w-4xl text-light-text">
          {homepageProcessCopy.title}
        </h2>
        <p className="body-large mt-5 max-w-2xl text-white/75">
          {homepageProcessCopy.description}
        </p>

        <ol
          className="relative mt-8 space-y-4 lg:mt-10 lg:space-y-5"
          data-process-mobile
          data-process-desktop
        >
          <span
            aria-hidden="true"
            className="absolute top-4 bottom-4 left-5 w-px bg-cyan/35 lg:left-[calc(min(42%,20rem)+1.15rem)]"
          />
          {homepageProcessSteps.map((item, index) => (
            <li
              key={item.number}
              className="relative grid gap-3 pl-10 lg:grid-cols-[minmax(12rem,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-8 lg:pl-0"
            >
              <span className="absolute top-6 left-3.5 size-3 rounded-full bg-cyan lg:hidden" />
              <ProductionStage step={index} />
              <StepCopy index={index} active />
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center">
          <p className="text-sm font-semibold text-light-text">
            {homepageProcessCopy.cta}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={"/magaza" as Route}
              className="inline-flex min-h-11 items-center rounded-md bg-coral px-5 text-sm font-semibold text-light-text"
            >
              {homepageProcessCopy.store}
            </Link>
            <Link
              href={"/model-yukle" as Route}
              className="inline-flex min-h-11 items-center rounded-md border border-white/20 px-5 text-sm font-semibold text-light-text"
            >
              {homepageProcessCopy.upload}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProcessSection() {
  return <HowItWorksSectionV2 />;
}
