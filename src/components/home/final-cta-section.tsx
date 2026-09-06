"use client";

import type { Route } from "next";
import Link from "next/link";

import { trackHomeEvent } from "@/lib/home/analytics";

export function FinalCtaSection() {
  return (
    <section id="basla" className="bg-[#0f1218] py-12 text-light-text sm:py-16">
      <div className="home-shell max-w-3xl">
        <h2 className="font-heading text-[1.75rem] leading-[1.06] font-bold tracking-[-0.045em] sm:text-4xl">
          Bugün üretmeye başla.
        </h2>
        <p className="mt-3 max-w-lg text-sm leading-6 text-white/70">
          Fikrini yaz, hazır model seç veya dosyanı yükle. Fiyat, gerçek üretim verisi olmadan vaat edilmez.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="#ne-uretmek-istiyorsun"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-orange px-5 text-sm font-semibold text-midnight"
          >
            Fikrini anlat
          </a>
          <Link
            href={"/hazir-modeller" as Route}
            onClick={() => trackHomeEvent({ name: "ready_model_cta_clicked" })}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 text-sm font-semibold"
          >
            Hazır model seç
          </Link>
          <Link
            href={"/model-yukle" as Route}
            onClick={() => trackHomeEvent({ name: "upload_cta_clicked" })}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 text-sm font-semibold"
          >
            Dosyanı yükle
          </Link>
        </div>
      </div>
    </section>
  );
}
