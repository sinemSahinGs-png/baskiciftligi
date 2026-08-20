"use client";

import { Check } from "lucide-react";

import type { GuidedEditorStep } from "@/lib/catalog/publication-checklist";
import { cn } from "@/lib/utils";

import { EDITOR_STEPS } from "./constants";

type StepRailProps = {
  currentStep: GuidedEditorStep;
  completionPercent: number;
  onStepSelect: (step: GuidedEditorStep) => void;
  visitedSteps: Set<GuidedEditorStep>;
};

export function StepRail({
  currentStep,
  completionPercent,
  onStepSelect,
  visitedSteps,
}: StepRailProps) {
  return (
    <nav
      aria-label="Ürün düzenleme adımları"
      className="hidden lg:block"
      data-testid="editor-step-rail"
    >
      <div className="rounded-3xl border border-white/10 bg-card p-4">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            İlerleme
          </p>
          <p className="mt-1 font-heading text-2xl text-cyan">
            %{completionPercent}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-cyan transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
        <ol className="space-y-2">
          {EDITOR_STEPS.map((step) => {
            const active = step.id === currentStep;
            const visited = visitedSteps.has(step.id);
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => onStepSelect(step.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors motion-reduce:transition-none",
                    active
                      ? "bg-cyan/10 text-foreground ring-1 ring-cyan/30"
                      : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full border text-xs font-bold",
                      active
                        ? "border-cyan bg-cyan text-ink"
                        : visited
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                          : "border-white/15",
                    )}
                  >
                    {visited && !active ? (
                      <Check className="size-4" aria-hidden="true" />
                    ) : (
                      step.id
                    )}
                  </span>
                  <span className="text-sm font-medium">{step.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

export function MobileProgressBar({
  currentStep,
  completionPercent,
}: {
  currentStep: GuidedEditorStep;
  completionPercent: number;
}) {
  const step = EDITOR_STEPS.find((item) => item.id === currentStep);
  return (
    <div
      className="sticky top-[4.5rem] z-20 border-b border-white/10 bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden"
      data-testid="editor-mobile-progress"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Adım {currentStep}/5
          </p>
          <p className="text-sm font-semibold">{step?.label}</p>
        </div>
        <p className="font-heading text-lg text-cyan">%{completionPercent}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${completionPercent}%` }}
        />
      </div>
    </div>
  );
}
