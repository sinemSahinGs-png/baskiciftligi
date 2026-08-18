import Link from "next/link";
import type { Route } from "next";

import { PermissionStatus } from "@/components/models/permission-status";
import { siteConfig } from "@/config/site";

const reviewSteps = [
  {
    title: "Kaynak incelendi",
    note: "Kayıt stüdyo demosudur; harici API çağrısı yapılmadı.",
  },
  {
    title: "Lisans okunacak",
    note: "Ticari üretim için lisans metni ayrı doğrulanmalıdır.",
  },
  {
    title: "Ticari izin doğrulanacak",
    note: "Kanıt ve platform onayı olmadan üretim açılmaz.",
  },
  {
    title: "Üretim seçenekleri",
    note: "İzin doğrulanınca yapılandırıcı burada belirir.",
  },
] as const;

export function PermissionReviewPanel({
  creator,
  sourceHref,
}: {
  creator: string;
  sourceHref?: string;
}) {
  return (
    <div className="rounded-xl border border-violet/35 bg-violet/12 p-5">
      <PermissionStatus state="unverified" />
      <h2 className="mt-5 font-heading text-2xl font-bold">
        İzin incelemesi sürüyor
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-light">
        Bu model görüntülenebilir ancak ücretli üretim izni henüz
        doğrulanmadı. {creator} kaydı için ticari üretim izni ayrıca
        incelenmeden satış açılmaz. {siteConfig.name} bu modeli satmaz,
        indirmez veya fiyatlandırmaz.
      </p>
      <ol className="mt-6 space-y-3">
        {reviewSteps.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-3 rounded-lg border border-white/10 bg-midnight/40 px-4 py-3"
          >
            <span className="tabular text-sm font-semibold text-cyan">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-light">
                {step.note}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        disabled
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-cobalt text-sm font-semibold text-light-text opacity-40"
      >
        Üretim seçeneklerini belirle
      </button>
      <div className="mt-4 space-y-2 text-sm">
        <Link href={"/hazir-modeller" as Route} className="block font-semibold underline">
          Doğrulanmış başka bir model seç
        </Link>
        {sourceHref ? (
          <a
            href={sourceHref}
            className="block text-muted-light underline"
            rel="noreferrer"
          >
            Orijinal kaynağı aç
          </a>
        ) : (
          <p className="text-muted-light">
            Orijinal kaynak bağlantısı bu demo kayıtta yok.
          </p>
        )}
        <p className="text-muted-light">
          İzin incelemesi talebi henüz gönderilemez.
        </p>
      </div>
    </div>
  );
}
