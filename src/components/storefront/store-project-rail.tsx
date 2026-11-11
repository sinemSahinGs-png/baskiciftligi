import type { Route } from "next";
import Link from "next/link";

import { projectDestinations } from "@/domain/project-destinations/catalog";
import { homepageStageCategories } from "@/domain/project-destinations/stage";

const PROJECT_ORDER = homepageStageCategories()
  .filter((item) => item.kind === "project")
  .map((item) => item.slug);

export function StoreProjectRail() {
  const items = PROJECT_ORDER.flatMap((slug) => {
    const destination = projectDestinations.find((item) => item.slug === slug);
    return destination ? [destination] : [];
  });

  return (
    <section className="store-project-rail" aria-labelledby="store-project-rail-title">
      <div className="shell">
        <p className="store-project-rail-kicker">OCTO STUDIO</p>
        <h2 id="store-project-rail-title">Koleksiyonlar</h2>
        <ul>
          {items.map((item) => (
            <li key={item.slug}>
              <Link href={item.href as Route} data-store-project={item.slug}>
                <img src={item.artwork} alt="" width={640} height={400} />
                <span>
                  <b>{item.name}</b>
                  <em>{item.eyebrow}</em>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
