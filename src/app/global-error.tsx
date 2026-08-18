"use client";

import { siteConfig } from "@/config/site";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body className="bg-[#070713] text-[#F9F8F5]">
        <main className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-24 text-center">
          <div>
            <p className="text-sm font-semibold">{siteConfig.name}</p>
            <h1 className="mt-5 text-4xl font-extrabold tracking-[-0.04em]">
              Uygulama güvenli şekilde durduruldu.
            </h1>
            <p className="mt-5 leading-7 text-[rgb(249_248_245/0.68)]">
              Sayfayı yeniden oluşturmayı deneyin. Devam eden bir işlem varsa
              ödeme veya sipariş durumunu hesabınızdan doğrulayın.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-8 rounded-md bg-[#4054FF] px-6 py-3 font-semibold text-[#F9F8F5]"
            >
              Yeniden dene
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
