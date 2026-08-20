"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";

import {
  assessPublicationReadiness,
  type PublicationChecklistItem,
} from "@/lib/catalog/publication-checklist";
import type { ProductFormInput } from "@/lib/validation/catalog";
import { publicationLabel } from "@/lib/catalog/visibility";

type PublicationChecklistProps = {
  values: ProductFormInput;
};

function ChecklistRow({ item }: { item: PublicationChecklistItem }) {
  const Icon = item.satisfied ? CheckCircle2 : CircleAlert;
  const tone = item.satisfied
    ? "text-emerald-300"
    : item.blocking
      ? "text-amber-300"
      : "text-muted-foreground";

  return (
    <li className={`flex items-start gap-2 text-sm ${tone}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{item.label}</span>
    </li>
  );
}

export function PublicationChecklist({ values }: PublicationChecklistProps) {
  const readiness = assessPublicationReadiness(values);
  const publishes =
    values.status === "active" || values.status === "scheduled";
  const blockingCount = readiness.items.filter(
    (item) => item.blocking && !item.satisfied,
  ).length;

  return (
    <section
      className="rounded-2xl border border-white/10 bg-black/20 p-4"
      aria-labelledby="publication-checklist-title"
      data-testid="publication-checklist"
    >
      <div className="mb-3 space-y-1">
        <h3
          id="publication-checklist-title"
          className="text-sm font-medium text-foreground"
        >
          Yayın kontrol listesi
        </h3>
        <p className="text-xs text-muted-foreground">
          Durum: {publicationLabel(values.status)}.
          {publishes
            ? blockingCount > 0
              ? ` Mağazada görünmek için ${blockingCount} eksik var.`
              : " Mağazada görünmeye hazır."
            : " Taslak ve arşiv kayıtları mağazada görünmez."}
        </p>
      </div>
      <ul className="space-y-2">
        {readiness.items.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}
