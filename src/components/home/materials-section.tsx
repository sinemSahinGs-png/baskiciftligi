import type { Route } from "next";
import Link from "next/link";

import { homepageMaterialCopy, homepageMaterialCore } from "@/domain/home/homepage";
import type { Material } from "@/domain/catalog/types";

function appearanceLabel(material: Material) {
  if (material.surfaceQuality >= 4) return "Pürüzsüz, detaylı yüzey";
  if (material.flexibility >= 4) return "Esnek, kavrayan yüzey";
  return "Dengeli üretim yüzeyi";
}

function pickHint(material: Material) {
  if (material.slug === "pla") return "İç mekân dekor ve hediye için ilk tercih.";
  if (material.slug === "petg") return "Nem ve darbe gören günlük parçalar için.";
  if (material.slug === "tpu") return "Conta, kılıf ve esneyen detaylar için.";
  return material.summary;
}

export function MaterialsSection({ materials }: { materials: Material[] }) {
  const visible = homepageMaterialCore
    .map((slug) => materials.find((material) => material.slug === slug))
    .filter((material): material is Material => Boolean(material));

  return (
    <section id="malzeme-secenekleri" className="home-section">
      <div className="home-shell">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="home-title home-mask-reveal">Malzeme seçenekleri</h2>
            <p className="home-lede">Yalnızca stüdyoda gerçekten açılan temel malzemeler.</p>
          </div>
          <Link href={"/malzemeler" as Route} className="home-see-all hidden sm:inline-flex">
            Tümünü gör
          </Link>
        </div>
        {visible.length > 0 ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {visible.map((material) => {
              const extra =
                homepageMaterialCopy[material.slug as keyof typeof homepageMaterialCopy];
              const sample = material.colors[0]?.hex ?? "#30d5d2";
              return (
                <Link
                  key={material.id}
                  href={`/malzemeler/${material.slug}` as Route}
                  className="home-press-card overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#f3efe6] text-[#14161c]"
                >
                  <span className="relative block h-20">
                    <span
                      className="absolute inset-0"
                      style={{
                        background: `radial-gradient(circle at 30% 40%, ${sample}, color-mix(in srgb, ${sample} 35%, #171721))`,
                      }}
                    />
                  </span>
                  <span className="block p-3.5">
                    <span className="font-heading text-xl font-bold tracking-[-0.04em]">
                      {material.name}
                    </span>
                    <span className="mt-1.5 block text-base leading-6 font-semibold">
                      {extra?.benefit ?? appearanceLabel(material)}
                    </span>
                    <span className="mt-2 block text-[0.875rem] leading-6 text-[#3d4148]">
                      {pickHint(material)}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        ) : null}
        <Link href={"/malzemeler" as Route} className="home-see-all mt-4 sm:hidden">
          Tümünü gör
        </Link>
      </div>
    </section>
  );
}
