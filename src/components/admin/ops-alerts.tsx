import Link from "next/link";
import { Bell } from "lucide-react";

export function OpsAlerts({ openCount }: { openCount: number }) {
  return (
    <Link
      href="/admin/gorevler"
      className="relative grid size-10 place-items-center rounded-full border border-white/15 text-muted-foreground hover:text-foreground"
      aria-label={`${openCount} açık görev`}
    >
      <Bell className="size-4" aria-hidden="true" />
      {openCount > 0 ? (
        <span className="absolute -top-1 -right-1 grid min-w-4 place-items-center rounded-full bg-[#f27a1a] px-1 text-[0.6rem] font-bold text-white">
          {openCount > 9 ? "9+" : openCount}
        </span>
      ) : null}
    </Link>
  );
}
