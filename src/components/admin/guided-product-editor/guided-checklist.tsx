"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle2, CircleAlert } from "lucide-react";

import type { PublicationChecklistItem } from "@/lib/catalog/publication-checklist";

type GuidedChecklistProps = {
  items: PublicationChecklistItem[];
  onItemSelect: (item: PublicationChecklistItem) => void;
};

export function GuidedChecklist({ items, onItemSelect }: GuidedChecklistProps) {
  const reduceMotion = useReducedMotion();

  return (
    <ul className="space-y-2" data-testid="guided-publication-checklist">
      {items.map((item) => {
        const Icon = item.satisfied ? CheckCircle2 : CircleAlert;
        const tone = item.satisfied ? "text-emerald-300" : "text-amber-300";

        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onItemSelect(item)}
              className={`flex w-full min-h-11 items-start gap-3 rounded-2xl border border-white/10 bg-black/15 px-3 py-3 text-left transition-colors hover:bg-white/[0.04] motion-reduce:transition-none ${tone}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={item.satisfied ? "done" : "todo"}
                  initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className="mt-0.5"
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                </motion.span>
              </AnimatePresence>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {item.shortLabel}
                </span>
                {!item.satisfied ? (
                  <span className="mt-0.5 block text-xs leading-5 text-amber-200/90">
                    {item.label}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
