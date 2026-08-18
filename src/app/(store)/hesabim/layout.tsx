import { redirect } from "next/navigation";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";

import { logoutAction } from "@/app/(auth)/actions";
import { AccountNav } from "@/components/auth/account-nav";
import { Logo } from "@/components/site/logo";
import { requireViewer } from "@/lib/auth/session";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await requireViewer();

  if (viewer.isDemo) {
    redirect("/giris?next=/hesabim");
  }

  return (
    <div className="min-h-screen bg-porcelain text-dark-text">
      <header className="border-b border-hairline bg-optical">
        <div className="shell flex min-h-16 items-center justify-between gap-4 py-3">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{viewer.displayName}</p>
              <p className="text-xs text-ink-muted">{viewer.email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 rounded-md border border-hairline px-4 text-sm font-semibold text-ink-secondary hover:text-ink"
              >
                <LogOut className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Çıkış</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="shell grid gap-8 py-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:py-12">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-xl border border-hairline bg-paper p-4">
            <div className="mb-5 flex items-center gap-3 border-b border-hairline px-2 pb-5">
              <span className="grid size-11 place-items-center rounded-md bg-muted">
                <UserRound className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {viewer.displayName}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  Doğrulanmış oturum
                </p>
              </div>
            </div>
            <AccountNav />
          </div>
        </aside>
        <main id="ana-icerik" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
