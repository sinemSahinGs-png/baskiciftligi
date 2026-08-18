import type { ReactNode } from "react";
import {
  Ban,
  FileX2,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Unplug,
  UserRoundX,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type LibraryStateId =
  | "api-unavailable"
  | "sign-in-required"
  | "permission-review"
  | "verified"
  | "not-permitted"
  | "removed"
  | "missing-file";

const states: Record<
  LibraryStateId,
  { title: string; description: string; icon: ReactNode; tone: string }
> = {
  "api-unavailable": {
    title: "Kaynak bağlantısı yok",
    description:
      "Resmî API kimlik bilgisi olmadan harici katalog sorgulanmaz, taranmaz veya taklit edilmez.",
    icon: <Unplug aria-hidden="true" className="size-5" />,
    tone: "border-white/12 bg-white/6",
  },
  "sign-in-required": {
    title: "Oturum gerekli",
    description:
      "İzin talebi veya ticari üretim başvurusu için giriş gerekir. Bu ekran otomatik indirme başlatmaz.",
    icon: <KeyRound aria-hidden="true" className="size-5" />,
    tone: "border-cyan/30 bg-cyan/10",
  },
  "permission-review": {
    title: "İzin incelemesi",
    description:
      "Lisans, atıf ve ticari üretim hakkı ayrı doğrulanır. İnceleme bitmeden satın alma açılmaz.",
    icon: <ShieldAlert aria-hidden="true" className="size-5" />,
    tone: "border-violet/35 bg-violet/15",
  },
  verified: {
    title: "Ticari üretim için doğrulandı",
    description:
      "Kayıtlı izin, kanıt ve platform onayı tamamlandığında üretim seçenekleri açılır.",
    icon: <ShieldCheck aria-hidden="true" className="size-5" />,
    tone: "border-lime/30 bg-lime/10",
  },
  "not-permitted": {
    title: "Ticari üretime kapalı",
    description:
      "Lisans veya hak sahibi ticari üretimi izinlemiyor. Fiyat veya sepet eylemi gösterilmez.",
    icon: <Ban aria-hidden="true" className="size-5" />,
    tone: "border-coral/35 bg-coral/12",
  },
  removed: {
    title: "Model kaldırıldı",
    description:
      "Kaynak kaydı artık yayında değil. Bu sayfa dosya veya fiyat uydurmaz.",
    icon: <UserRoundX aria-hidden="true" className="size-5" />,
    tone: "border-white/12 bg-white/6",
  },
  "missing-file": {
    title: "Dosya yok",
    description:
      "İndirilebilir geometri bu kayda bağlı değil. Dilimleme veya sahte önizleme üretilmez.",
    icon: <FileX2 aria-hidden="true" className="size-5" />,
    tone: "border-white/12 bg-white/6",
  },
};

export function ModelLibraryState({
  id,
  compact = false,
}: {
  id: LibraryStateId;
  compact?: boolean;
}) {
  const item = states[id];

  return (
    <article
      className={cn(
        "rounded-xl border px-5 py-5",
        item.tone,
        compact && "px-4 py-4",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-black/20">
          {item.icon}
        </span>
        <div>
          <h3 className="font-heading text-xl font-bold">{item.title}</h3>
          {compact ? null : (
            <p className="mt-2 text-sm leading-6 text-muted-light">
              {item.description}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

export function ModelLibraryStateGrid({
  ids,
}: {
  ids: LibraryStateId[];
}) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {ids.map((id) => (
        <li key={id}>
          <ModelLibraryState id={id} />
        </li>
      ))}
    </ul>
  );
}
