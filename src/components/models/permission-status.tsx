import { cn } from "@/lib/utils";

export type PermissionState =
  | "discovery"
  | "license-review"
  | "permission-requested"
  | "verified"
  | "unavailable"
  | "api-unavailable"
  | "sign-in-required"
  | "unverified"
  | "not-permitted"
  | "removed"
  | "missing-file";

const copy: Record<PermissionState, { label: string; explanation: string }> = {
  discovery: {
    label: "Keşif",
    explanation: "Model incelenebilir; üretim henüz açılmadı.",
  },
  "license-review": {
    label: "Lisans incelemesi gerekli",
    explanation: "Ticari üretim için lisans metni ayrı doğrulanmalıdır.",
  },
  "permission-requested": {
    label: "İzin talebi gönderildi",
    explanation: "Tasarım sahibinden ticari üretim onayı bekleniyor.",
  },
  verified: {
    label: "Ticari izin doğrulandı",
    explanation: "Bu model, kayıtlı izinle üretime alınabilir.",
  },
  unavailable: {
    label: "Üretime kapalı",
    explanation: "Bu kayıt üretim veya satış için uygun değil.",
  },
  "api-unavailable": {
    label: "Kaynak bağlantısı yok",
    explanation: "Harici katalog şu anda sorgulanamıyor.",
  },
  "sign-in-required": {
    label: "Oturum gerekli",
    explanation: "İzin talebi için giriş yapmanız gerekir.",
  },
  unverified: {
    label: "İzin doğrulanmadı",
    explanation: "Bu model için üretim izni henüz doğrulanmadı.",
  },
  "not-permitted": {
    label: "Ticari üretime kapalı",
    explanation: "Hak sahibi ticari üretimi izinlemiyor.",
  },
  removed: {
    label: "Kayıt kaldırıldı",
    explanation: "Kaynak artık yayında değil.",
  },
  "missing-file": {
    label: "Dosya yok",
    explanation: "İndirilebilir geometri bu kayda bağlı değil.",
  },
};

export function PermissionStatus({
  state,
  compact = false,
}: {
  state: PermissionState;
  compact?: boolean;
}) {
  const item = copy[state];

  return (
    <div
      className={cn(
        "rounded-md px-3 py-2",
        state === "verified"
          ? "bg-success/15 text-success"
          : state === "not-permitted" || state === "removed"
            ? "bg-coral/12"
            : "bg-violet/12",
      )}
    >
      <p className="text-xs font-semibold">{item.label}</p>
      {compact ? null : (
        <p className="mt-1 text-xs leading-5 opacity-70">
          {item.explanation}
        </p>
      )}
    </div>
  );
}
