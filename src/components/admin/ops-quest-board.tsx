import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { Check, Lock, Sparkles } from "lucide-react";

import { completeOpsQuestAction } from "@/app/admin/gorevler/actions";
import type { OpsQuest } from "@/domain/admin/ops-board";
import { cn } from "@/lib/utils";

export function OpsQuestBoard({
  quests,
  xp,
  maxXp,
}: {
  quests: OpsQuest[];
  xp: number;
  maxXp: number;
}) {
  const percent = maxXp ? Math.round((xp / maxXp) * 100) : 0;
  const site = quests.filter((item) => item.lane === "site");
  const growth = quests.filter((item) => item.lane === "growth");

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-cyan/20 bg-cyan/5 p-6">
        <p className="text-[0.65rem] font-bold tracking-[0.16em] text-cyan uppercase">
          Seviye
        </p>
        <p className="mt-2 font-heading text-3xl font-medium">
          {xp} / {maxXp} XP
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-cyan" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Önce siteyi satışa hazırla. Sonra reklam ve keşif görevleri açılır.
        </p>
      </section>

      <Lane title="1. Site" icon={<Lock className="size-4" />} items={site} />
      <Lane
        title="2. Şirketi büyüt"
        icon={<Sparkles className="size-4" />}
        items={growth}
      />
    </div>
  );
}

function Lane({
  title,
  icon,
  items,
}: {
  title: string;
  icon: ReactNode;
  items: OpsQuest[];
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-[0.7rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
        {icon}
        {title}
      </h2>
      <ul className="grid gap-3">
        {items.map((quest) => (
          <li
            key={quest.id}
            className={cn(
              "rounded-2xl border p-5",
              quest.done
                ? "border-emerald-400/25 bg-emerald-400/5"
                : "border-white/10 bg-card",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-heading text-lg font-medium">{quest.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {quest.why}
                </p>
                <p className="mt-2 text-xs font-bold tracking-wide text-cyan">
                  +{quest.xp} XP
                </p>
              </div>
              {quest.done ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
                  <Check className="size-3.5" />
                  Tamam
                </span>
              ) : quest.auto ? (
                <Link
                  href={quest.href as Route}
                  className="inline-flex min-h-10 items-center rounded-full bg-cyan px-4 text-sm font-bold text-ink"
                >
                  {quest.cta}
                </Link>
              ) : (
                <form action={completeOpsQuestAction}>
                  <input type="hidden" name="questId" value={quest.id} />
                  <button
                    type="submit"
                    className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold"
                  >
                    Yaptım
                  </button>
                </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
