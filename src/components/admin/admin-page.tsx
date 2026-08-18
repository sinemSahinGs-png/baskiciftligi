import type { ReactNode } from "react";
import { CheckCircle2, CircleDashed, LockKeyhole, Wrench } from "lucide-react";

interface AdminPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: AdminPageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div>
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h1 className="font-heading text-3xl font-medium tracking-[-0.05em] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

interface StagedAdminPageProps {
  title: string;
  description: string;
  phase: string;
  requirements: readonly string[];
  foundations?: readonly string[];
}

export function StagedAdminPage({
  title,
  description,
  phase,
  requirements,
  foundations = [],
}: StagedAdminPageProps) {
  return (
    <>
      <AdminPageHeader
        eyebrow={`Operasyon / ${phase}`}
        title={title}
        description={description}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <section className="rounded-3xl border border-white/10 bg-card p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-warm/25 bg-warm/8 text-warm">
              <Wrench className="size-5" aria-hidden="true" />
            </span>
            <div>
              <span className="inline-flex rounded-full border border-white/10 px-2.5 py-1 text-[0.65rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                Planlanan: {phase}
              </span>
              <h2 className="mt-4 font-heading text-xl font-medium">
                Operasyon akışı henüz etkin değil
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Bu sayfa sahte kayıt veya çalışmayan kontrol göstermez. Yetkili
                veri kaynağı ve sunucu tarafı iş kuralları tamamlandığında gerçek
                operasyon görünümü açılacaktır.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <LockKeyhole className="size-4 text-cyan" aria-hidden="true" />
              Açılma gereksinimleri
            </h3>
            <ul className="mt-4 space-y-3">
              {requirements.map((requirement) => (
                <li
                  key={requirement}
                  className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
                >
                  <CircleDashed
                    className="mt-1 size-4 shrink-0 text-warm"
                    aria-hidden="true"
                  />
                  {requirement}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <aside className="rounded-3xl border border-white/10 bg-card p-6">
          <p className="text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
            Hazır temeller
          </p>
          {foundations.length ? (
            <ul className="mt-5 space-y-4">
              {foundations.map((foundation) => (
                <li
                  key={foundation}
                  className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
                >
                  <CheckCircle2
                    className="mt-1 size-4 shrink-0 text-emerald-300"
                    aria-hidden="true"
                  />
                  {foundation}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Bu modül için doğrulanmış bir çalışma temeli henüz bağlanmadı.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
