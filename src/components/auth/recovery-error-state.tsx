import Link from "next/link";
import { KeyRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { RecoveryErrorReason } from "@/lib/auth/callback-destination";
import { cn } from "@/lib/utils";

const COPY: Record<
  RecoveryErrorReason,
  { title: string; description: string }
> = {
  expired: {
    title: "Sıfırlama bağlantısının süresi doldu",
    description:
      "Bu bağlantı artık geçerli değil. Güvenlik için kısa ömürlüdür. Yeni bir sıfırlama e-postası isteyin.",
  },
  reused: {
    title: "Bu bağlantı daha önce kullanıldı",
    description:
      "Şifre sıfırlama bağlantıları tek kullanımlıktır. Yeni bir bağlantı isteyerek devam edin.",
  },
  malformed: {
    title: "Sıfırlama bağlantısı geçersiz",
    description:
      "Bağlantı eksik veya bozulmuş. Adres çubuğundaki jetonları kopyalamayın; e-postadaki düğmeyi kullanın.",
  },
  "missing-verifier": {
    title: "Bu tarayıcıda doğrulama tamamlanamadı",
    description:
      "Şifre sıfırlama, isteği başlattığınız tarayıcıda açılmalıdır. Farklı bir cihaz veya gizli pencerede açtıysanız yeni bir bağlantı isteyin.",
  },
};

export function RecoveryErrorState({
  reason,
}: {
  reason: RecoveryErrorReason;
}) {
  const copy = COPY[reason] ?? COPY.malformed;

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <p className="mb-5 text-sm font-semibold text-ink-secondary">
          Şifre kurtarma
        </p>
        <h1 className="font-heading text-4xl leading-tight font-medium tracking-[-0.05em] sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-4 max-w-md text-base leading-7 text-muted-foreground">
          {copy.description}
        </p>
      </div>
      <div className="rounded-[1.25rem] border border-hairline bg-optical p-6 sm:p-8">
        <Link
          href="/sifre-unuttum"
          className={cn(buttonVariants({ size: "lg" }), "w-full")}
        >
          <KeyRound aria-hidden="true" />
          Yeni sıfırlama bağlantısı iste
        </Link>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link href="/giris" className="font-semibold underline-offset-4 hover:underline">
            Giriş sayfasına dön
          </Link>
        </p>
      </div>
    </div>
  );
}
