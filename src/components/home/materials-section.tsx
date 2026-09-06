"use client";

import type { Route } from "next";
import Link from "next/link";

import { homepageMaterialCopy, homepageMaterialOrder } from "@/domain/home/homepage";
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
  if (material.slug === "asa") return "Güneş gören dış mekân için.";
  if (material.slug === "standart-recine") return "İnce figür ve pürüzsüz prototip için.";
  return material.summary;
}

export function MaterialsSection({ materials }: { materials: Material[] }) {
  const ordered = homepageMaterialOrder
    .map((slug) => materials.find((material) => material.slug === slug))
    .filter((material): material is Material => Boolean(material));
  const extras = materials.filter(
    (material) => !ordered.some((item) => item.id === material.id),
  );
  const visible = [...ordered, ...extras];

  return (
    <section id="malzeme-secenekleri" className="bg-[#ece7dc] py-12 sm:py-16">
      <div className="home-shell">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-[1.65rem] leading-[1.08] font-bold tracking-[-0.04em] sm:text-3xl">
              Malzeme seçenekleri
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-ink-secondary">
              Yalnızca stüdyoda gerçekten açılan malzemeler.
            </p>
          </div>
          <Link
            href={"/malzemeler" as Route}
            className="hidden min-h-11 items-center text-sm font-semibold sm:inline-flex"
          >
            Malzeme rehberi
          </Link>
        </div>
        {visible.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((material) => {
            const extra =
              homepageMaterialCopy[material.slug as keyof typeof homepageMaterialCopy];
            const sample = material.colors[0]?.hex ?? "#30d5d2";
            return (
              <Link
                key={material.id}
                href={`/malzemeler/${material.slug}` as Route}
                className="overflow-hidden rounded-2xl bg-[#f7f4ee] shadow-[0_18px_40px_-28px_rgb(23_23_33/0.4)] transition duration-200 hover:-translate-y-0.5"
              >
                <span className="relative block h-28">
                  <span
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at 30% 40%, ${sample}, color-mix(in srgb, ${sample} 35%, #171721))`,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute top-1/2 left-1/2 size-[4.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-[10px] border-white/20 shadow-[inset_0_12px_18px_rgb(255_255_255/0.25)]"
                    style={{ background: sample }}
                  />
                </span>
                <span className="block p-4 text-dark-text">
                  <span className="font-heading text-2xl font-bold tracking-[-0.04em]">
                    {material.name}
                  </span>
                  <span className="mt-2 block text-sm font-semibold">
                    {extra?.benefit ?? appearanceLabel(material)}
                  </span>
                  <span className="mt-3 grid gap-1 text-sm text-ink-secondary">
                    <span>Dayanıklılık {material.durability}/5</span>
                    <span>{appearanceLabel(material)}</span>
                    <span>{extra?.usage ?? material.useCases[0]}</span>
                    <span>{material.suitability}</span>
                  </span>
                  <span className="mt-3 block text-sm font-semibold text-ink">
                    {pickHint(material)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        ) : null}
        <Link
          href={"/malzemeler" as Route}
          className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold sm:hidden"
        >
          Malzeme rehberi
        </Link>
      </div>
    </section>
  );
}
