"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Octo Studio] Route error", {
      digest: error.digest,
      name: error.name,
    });
  }, [error]);

  return (
    <main
      id="ana-icerik"
      className="shell flex min-h-[70vh] items-center justify-center py-24"
    >
      <div className="max-w-xl text-center">
        <div className="bg-coral/15 text-coral mx-auto mb-6 flex size-14 items-center justify-center rounded-full">
          <AlertTriangle aria-hidden="true" className="size-6" />
        </div>
        <p className="eyebrow justify-center">Beklenmeyen durum</p>
        <h1 className="mt-5 text-4xl font-medium sm:text-5xl">
          Bu katman planlandığı gibi oluşmadı.
        </h1>
        <p className="text-muted-foreground mx-auto mt-5 max-w-md leading-7">
          Güvenli bir şekilde yeniden deneyebilirsiniz. Sorun sürerse hata koduyla
          birlikte bizimle iletişime geçin.
        </p>
        {error.digest ? (
          <p className="text-steel mt-3 font-mono text-xs">
            Hata kodu: {error.digest}
          </p>
        ) : null}
        <Button onClick={reset} className="mt-8">
          <RotateCcw aria-hidden="true" />
          Yeniden dene
        </Button>
      </div>
    </main>
  );
}
