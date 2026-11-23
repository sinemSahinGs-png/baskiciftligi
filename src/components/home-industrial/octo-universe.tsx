"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { CategoryArtwork } from "@/components/catalog/category-artwork";
import { homepageStageCategories } from "@/domain/project-destinations/stage";

const CHAMBER_ORDER = ["orbia", "memoora", "lil-disc"] as const;

export function OctoUniverse() {
  const t = useTranslations();
  const projects = CHAMBER_ORDER.flatMap((slug) =>
    homepageStageCategories().filter((item) => item.kind === "project" && item.slug === slug),
  );

  return (
    <section
      id="octo-evreni"
      data-home-theme="obsidian"
      data-octo-zone="collection"
      className="octo-band octo-band-obsidian octo-universe"
      aria-labelledby="universe-heading"
    >
      <div className="hi-shell octo-band-shell">
        <h2 id="universe-heading" className="octo-band-title octo-band-title-light">
          {t("home.universeTitle")}
        </h2>
        <p className="octo-band-lede">{t("home.universeLede")}</p>
        <ul className="octo-rooms">
          {projects.map((project) => (
            <li key={project.slug}>
              <Link
                href={project.href}
                className="octo-room"
                data-category-slug={project.slug}
                data-chamber={project.slug}
                data-stage-kind="project"
              >
                <span className="octo-room-visual">
                  <CategoryArtwork
                    src={project.artwork}
                    objectPosition={
                      project.slug === "memoora"
                        ? "50% 42%"
                        : project.slug === "lil-disc"
                          ? "50% 46%"
                          : "50% 38%"
                    }
                    sizes="(max-width: 767px) 86vw, 32vw"
                  />
                </span>
                <span className="octo-room-copy">
                  {project.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- destination marks are already static public assets
                    <img className="octo-universe-logo" src={project.logo} alt="" />
                  ) : null}
                  <span className="octo-universe-name">
                    {t(`categories.${project.slug}.name`)}
                  </span>
                  <span className="octo-universe-desc">
                    {t(`categories.${project.slug}.description`)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
