"use client";

import type { Route } from "next";
import Link from "next/link";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { homepageCorporateOffers } from "@/domain/home/homepage";
import { trackHomeEvent } from "@/lib/home/analytics";

export function B2bSection() {
  return (
    <section id="kurumsal-uretim" className="relative overflow-hidden bg-[#0b0d11] text-light-text">
      <FoundryGrid variant="corner" className="opacity-50" />
      <div className="home-shell relative grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-orange uppercase">
            Kurumsal üretim
          </p>
          <h2 className="mt-3 font-heading text-[1.75rem] leading-[1.06] font-bold tracking-[-0.045em] sm:text-4xl">
            Tekrarlanabilir üretim, kontrollü kapasite.
          </h2>
          <ul className="mt-5 space-y-2 text-sm leading-6 text-white/75">
            <li>Çoklu yazıcı ile parti işleri</li>
            <li>Numune ve seri üretim aynı süreçte</li>
            <li>Dosya yalnızca üretim değerlendirmesi için işlenir</li>
          </ul>
          <Link
            href={"/kurumsal-uretim#brief" as Route}
            onClick={() => trackHomeEvent({ name: "corporate_cta_clicked" })}
            className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-orange px-5 text-sm font-semibold text-midnight"
          >
            Kurumsal teklif al
          </Link>
        </div>
        <ul className="grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-2">
          {homepageCorporateOffers.map((item) => (
            <li key={item.title} className="bg-[#12151c] p-5">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-white/65">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
