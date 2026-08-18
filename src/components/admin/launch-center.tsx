"use client";

import { useState, useTransition } from "react";

import { runLiveSmokeAction } from "@/app/admin/yayina-alma/actions";
import type {
  LaunchCheckItem,
  LaunchChecklistStep,
  LaunchStatus,
} from "@/lib/launch/status";
import { toneForLaunchStatus } from "@/lib/launch/status";
import type { LaunchReadinessSnapshot } from "@/lib/launch/types";
import type { LaunchSmokeResult } from "@/lib/launch/smoke-store";
import { cn } from "@/lib/utils";

function StatusPill({ status }: { status: LaunchStatus }) {
  const tone = toneForLaunchStatus(status);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.08em] uppercase",
        tone === "ready" && "bg-emerald-500/15 text-emerald-300",
        tone === "action" && "bg-amber-500/15 text-amber-200",
        tone === "danger" && "bg-red-500/15 text-red-300",
        tone === "neutral" && "bg-white/8 text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

function isLaunchCheckItem(value: unknown): value is LaunchCheckItem {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "status" in value &&
      "label" in value,
  );
}

function CheckList({
  title,
  items,
}: {
  title: string;
  items: LaunchCheckItem[];
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-card p-6">
      <h2 className="font-heading text-xl font-medium">{title}</h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex flex-col gap-2 border-b border-white/8 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </div>
            <StatusPill status={item.status} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LaunchCenter({
  snapshot,
  checklist,
}: {
  snapshot: LaunchReadinessSnapshot;
  checklist: LaunchChecklistStep[];
}) {
  const [pending, startTransition] = useTransition();
  const [smoke, setSmoke] = useState<LaunchSmokeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {snapshot.safety.warning ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {snapshot.safety.warning}
        </p>
      ) : null}

      <CheckList title="Alan adı ve dağıtım" items={Object.values(snapshot.domain)} />

      <section className="rounded-3xl border border-white/10 bg-card p-6">
        <h2 className="font-heading text-xl font-medium">Katalog ve Supabase</h2>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/8 p-4">
            <dt className="text-xs text-muted-foreground">Ürün</dt>
            <dd className="mt-1 text-2xl font-semibold">
              {snapshot.catalog.counts.products ?? "—"}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/8 p-4">
            <dt className="text-xs text-muted-foreground">Yayınlanmış</dt>
            <dd className="mt-1 text-2xl font-semibold">
              {snapshot.catalog.counts.publishedProducts ?? "—"}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/8 p-4">
            <dt className="text-xs text-muted-foreground">Kategori</dt>
            <dd className="mt-1 text-2xl font-semibold">
              {snapshot.catalog.counts.categories ?? "—"}
            </dd>
          </div>
          <div className="rounded-2xl border border-white/8 p-4">
            <dt className="text-xs text-muted-foreground">Görsel</dt>
            <dd className="mt-1 text-2xl font-semibold">
              {snapshot.catalog.counts.productImages ?? "—"}
            </dd>
          </div>
        </dl>
        <ul className="mt-5 space-y-3">
          {Object.values(snapshot.catalog)
            .filter(isLaunchCheckItem)
            .map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 border-b border-white/8 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
                <StatusPill status={item.status} />
              </li>
            ))}
        </ul>
      </section>

      <CheckList title="Thingiverse" items={Object.values(snapshot.thingiverse)} />
      <CheckList title="Otomatik teklif" items={Object.values(snapshot.quotation)} />
      <CheckList title="Ödeme" items={Object.values(snapshot.payment)} />
      <CheckList title="İletişim" items={Object.values(snapshot.communications)} />

      <section className="rounded-3xl border border-white/10 bg-card p-6">
        <h2 className="font-heading text-xl font-medium">Yayına alma listesi</h2>
        <ol className="mt-5 space-y-4">
          {checklist.map((step) => (
            <li key={step.id} className="rounded-2xl border border-white/8 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{step.title}</h3>
                <StatusPill status={step.status} />
              </div>
              <dl className="mt-3 grid gap-2 text-sm text-muted-foreground">
                <div>
                  <dt className="font-semibold text-foreground">Eksik</dt>
                  <dd>{step.missing}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Neden önemli</dt>
                  <dd>{step.why}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Nerede ayarlanır</dt>
                  <dd>{step.where}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Nasıl doğrulanır</dt>
                  <dd>{step.howVerified}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-foreground">Müşteri etkisi</dt>
                  <dd>{step.customerImpact}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-3xl border border-white/10 bg-card p-6">
        <h2 className="font-heading text-xl font-medium">Canlı sistem</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sipariş, ödeme, model yükleme, dilimleme veya e-posta gönderilmez.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              try {
                const result = await runLiveSmokeAction();
                setSmoke(result);
              } catch (caught) {
                setError(
                  caught instanceof Error ? caught.message : "Kontrol çalıştırılamadı.",
                );
              }
            });
          }}
          className="mt-4 inline-flex min-h-11 items-center rounded-full bg-cyan px-5 text-sm font-bold text-ink disabled:opacity-60"
        >
          {pending ? "Kontrol ediliyor…" : "Canlı sistemi kontrol et"}
        </button>
        {error ? (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        {smoke ? (
          <ul className="mt-4 space-y-2 text-sm">
            {smoke.checks.map((check) => (
              <li key={check.name}>
                {check.name}: {check.detail}
              </li>
            ))}
            <li className="text-muted-foreground">Zaman: {smoke.at}</li>
          </ul>
        ) : null}
      </section>
    </div>
  );
}
