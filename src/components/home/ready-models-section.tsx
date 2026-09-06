import type { Route } from "next";
import Link from "next/link";

import { HomeTrackLink } from "@/components/home/home-track-link";
import { SafeImage } from "@/components/media/safe-image";

export interface ReadyModelCard {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  href: string;
  source?: "curated" | "thingiverse" | "fallback";
}

export function ReadyModelsSection({
  fallback,
}: {
  fallback: ReadyModelCard[];
}) {
  const visible = fallback.slice(0, 4);

  return (
    <section id="sana-gore-hazir-modeller" className="home-section relative overflow-hidden">
      <div className="home-shell relative">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="home-title home-mask-reveal">Sana göre hazır modeller</h2>
            <p className="home-lede">İlk dört model hemen görünür. Kütüphane bir dokunuş ötede.</p>
          </div>
          <HomeTrackLink
            event="ready_model_cta_clicked"
            href={"/hazir-modeller" as Route}
            className="home-see-all hidden sm:inline-flex"
          >
            Tümünü gör
          </HomeTrackLink>
        </div>

        {visible.length === 0 ? (
          <Link
            href={"/hazir-modeller" as Route}
            className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-orange px-5 text-[0.9375rem] font-semibold text-midnight"
          >
            Tüm hazır modelleri gör
          </Link>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3">
            {visible.map((model) => (
              <ReadyCard key={model.id} model={model} />
            ))}
          </div>
        )}

        <HomeTrackLink
          event="ready_model_cta_clicked"
          href={"/hazir-modeller" as Route}
          className="home-see-all mt-4 sm:hidden"
        >
          Tümünü gör
        </HomeTrackLink>
      </div>
    </section>
  );
}

function ReadyCard({ model }: { model: ReadyModelCard }) {
  return (
    <Link
      href={model.href as Route}
      className="home-press-card home-reveal-card group flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#f3efe6] text-[#14161c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
    >
      <span className="relative block aspect-[4/5] bg-[#ece6d8]">
        <SafeImage
          src={model.imageUrl}
          alt={model.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          fallbackLabel="3D model"
          className="object-cover"
        />
      </span>
      <span className="flex min-h-[5.5rem] flex-col p-3">
        <span className="text-[0.75rem] font-semibold tracking-wide text-[#0f6f6d] uppercase">
          Hazır 3D model
        </span>
        <span className="mt-1 line-clamp-2 font-heading text-base leading-6 font-semibold">
          {model.name}
        </span>
      </span>
    </Link>
  );
}
