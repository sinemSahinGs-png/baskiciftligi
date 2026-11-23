"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { CategoryArtwork } from "@/components/catalog/category-artwork";
import { homepageStageCategories } from "@/domain/project-destinations/stage";

export function OctoUniverse() {
  const t = useTranslations();
  const projects = homepageStageCategories().filter((item) => item.kind === "project");

  return (
    <section
      id="octo-evreni"
      data-home-theme="obsidian"
      className="octo-band octo-band-obsidian octo-universe"
      aria-labelledby="universe-heading"
    >
      <div className="hi-shell octo-band-shell">
        <h2 id="universe-heading" className="octo-band-title octo-band-title-light">
          {t("home.universeTitle")}
        </h2>
        <p className="octo-band-lede">{t("home.universeLede")}</p>
        <ul className="octo-universe-grid">
          {projects.map((project) => (
            <li key={project.slug}>
              <Link
                href={project.href}
                className="octo-universe-card"
                data-category-slug={project.slug}
                data-stage-kind="project"
              >
                <CategoryArtwork
                  src={project.artwork}
                  objectPosition="50% 42%"
                  sizes="(max-width: 767px) 92vw, 32vw"
                />
                {project.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- destination marks are already static public assets
                  <img className="octo-universe-logo" src={project.logo} alt="" />
                ) : null}
                <span className="octo-universe-copy">
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
