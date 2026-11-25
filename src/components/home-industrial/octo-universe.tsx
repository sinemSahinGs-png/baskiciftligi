"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { CategoryArtwork } from "@/components/catalog/category-artwork";
import { ScrollWords } from "@/components/home-industrial/scroll-words";
import { homepageStageCategories } from "@/domain/project-destinations/stage";

const CHAMBER_ORDER = ["orbia", "memoora", "lil-disc"] as const;

function OctoMark() {
  return (
    <svg className="octo-mark" viewBox="0 0 16 16" aria-hidden="true">
      <polygon
        points="8,1.2 14.2,4.6 14.2,11.4 8,14.8 1.8,11.4 1.8,4.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
      />
    </svg>
  );
}

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
        <ScrollWords
          as="h2"
          id="universe-heading"
          className="octo-band-title octo-band-title-light octo-universe-heading"
          text={t("home.universeTitle")}
        />
        <ScrollWords as="p" className="octo-band-lede" text={t("home.universeLede")} />
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
                    objectPosition="50% 50%"
                    sizes="(max-width: 767px) 86vw, 32vw"
                  />
                </span>
                <span className="octo-room-copy">
                  <OctoMark />
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
