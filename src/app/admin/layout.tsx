import Link from "next/link";
import { headers } from "next/headers";
import {
  ExternalLink,
  FlaskConical,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";

import { logoutAction } from "@/app/(auth)/actions";
import { adminLogoutAction } from "@/app/admin/giris/actions";
import { AdminMark, AdminNav } from "@/components/admin/admin-nav";
import { siteConfig } from "@/config/site";
import { isAdminLoginPath } from "@/lib/auth/admin-password";
import { isLocalAdminPasswordEnabled } from "@/lib/auth/admin-session";
import { requireAdmin } from "@/lib/auth/session";
import { staffRoleLabel } from "@/lib/auth/staff-role";
import {
  productionFixtureWarning,
  readProductionSafetyFlags,
} from "@/lib/launch/production-flags";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (isAdminLoginPath(pathname)) {
    return (
      <div className="dark min-h-screen bg-[#090b0e] text-[#F6F3EC]">
        {children}
      </div>
    );
  }

  const viewer = await requireAdmin();
  const fixtureWarning = productionFixtureWarning(readProductionSafetyFlags());
  const logout = isLocalAdminPasswordEnabled()
    ? adminLogoutAction
    : logoutAction;

  return (
    <div className="dark min-h-screen bg-[#090b0e] text-[#F6F3EC]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090b0e]/90 backdrop-blur-xl">
        <div className="flex min-h-18 items-center gap-4 px-4 sm:px-6">
          <Link
            href="/admin"
            className="flex items-center gap-3 lg:w-[16rem]"
            aria-label={`${siteConfig.name} yönetim ana sayfası`}
          >
            <AdminMark />
            <span>
              <span className="block font-heading text-sm font-semibold tracking-[-0.02em]">
                {siteConfig.name}
              </span>
              <span className="block text-[0.65rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                Yönetim merkezi
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-semibold text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground sm:inline-flex"
            >
              Mağazayı aç
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </Link>
            <div className="hidden border-l border-white/10 pl-3 text-right md:block">
              <p className="text-xs font-semibold">{viewer.displayName}</p>
              <p className="flex items-center justify-end gap-1 text-[0.65rem] text-muted-foreground">
                <ShieldCheck className="size-3" aria-hidden="true" />
                {staffRoleLabel(viewer.role)}
              </p>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="grid size-10 place-items-center rounded-full border border-white/15 text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground"
                aria-label="Oturumu kapat"
              >
                <LogOut className="size-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {fixtureWarning ? (
        <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-2.5 sm:px-6">
          <p className="mx-auto max-w-[110rem] text-sm text-red-200">
            <strong>{fixtureWarning.title}.</strong> {fixtureWarning.body}
          </p>
        </div>
      ) : null}

      {viewer.isDemo ? (
        <div className="border-b border-warm/25 bg-warm/8 px-4 py-2.5 sm:px-6">
          <div className="mx-auto flex max-w-[110rem] items-start gap-2 text-xs leading-5 text-warm">
            <FlaskConical
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <p>
              <strong>Yerel geliştirme demo modu.</strong> Katalog değişiklikleri
              yalnızca bu makinedeki{" "}
              <span className="font-mono">.octo-data/catalog.json</span> dosyasına
              yazılır; gerçek sipariş, müşteri veya ödeme verisi değildir.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[110rem] lg:grid-cols-[17.5rem_minmax(0,1fr)]">
        <aside className="hidden min-h-[calc(100vh-4.5rem)] border-r border-white/10 p-4 lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
            <AdminNav />
          </div>
        </aside>

        <div className="min-w-0">
          <details className="border-b border-white/10 px-4 py-3 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
              <Menu className="size-4" aria-hidden="true" />
              Yönetim menüsü
            </summary>
            <div className="mt-4 max-h-[65vh] overflow-y-auto rounded-2xl border border-white/10 bg-card p-3">
              <AdminNav />
            </div>
          </details>
          <main id="ana-icerik" className="p-4 sm:p-6 xl:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
