import type { Route } from "next";
import Link from "next/link";

import { FoundryGrid } from "@/components/brand/foundry-grid";
import { SafeImage } from "@/components/media/safe-image";
import type { Category } from "@/domain/catalog/types";
import {
  categoryImageFitClass,
  categoryImageStyle,
  resolveCategoryImagePresentation,
} from "@/lib/catalog/category-image";
import { cn } from "@/lib/utils";

const surfaces: Record<string, string> = {
  "biblo-ve-heykel": "bg-violet text-light-text",
  "masaustu-aksesuarlari": "bg-cobalt text-light-text",
  "kisiye-ozel-urunler": "bg-coral text-light-text",
  "fonksiyonel-parcalar": "bg-carbon text-light-text",
  "ev-ve-dekorasyon": "bg-cyan text-midnight",
  anahtarlik: "bg-optical text-dark-text",
  magnet: "bg-neutral text-dark-text",
  "kurumsal-promosyon": "atmosphere-foundry",
};

export function CategoryCard({
  category,
  count,
  index,
  imageUrl,
}: {
  category: Category;
  count?: number;
  index: number;
  imageUrl?: string;
}) {
  const cover = imageUrl ?? category.imageUrl;
  const photoCover = Boolean(cover) && !cover.endsWith(".svg");
  const presentation = resolveCategoryImagePresentation(category);
  const darkText =
    category.slug === "anahtarlik" ||
    category.slug === "magnet" ||
    category.slug === "ev-ve-dekorasyon";

  return (
    <Link
      href={`/magaza/${category.slug}` as Route}
      className={cn(
        "group relative flex min-h-11 w-full overflow-hidden rounded-lg",
        surfaces[category.slug] ?? "bg-cobalt text-light-text",
      )}
    >
      <span className="relative block aspect-[4/3] w-full min-h-0">
        {photoCover ? (
          <>
            <SafeImage
              src={cover}
              alt=""
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className={cn(
                categoryImageFitClass(presentation.fit),
                "transition duration-500 group-hover:brightness-110",
              )}
              style={categoryImageStyle(presentation)}
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
          </>
        ) : (
          <>
            {category.slug === "fonksiyonel-parcalar" ||
            category.slug === "kurumsal-promosyon" ? (
              <FoundryGrid variant="corner" className="opacity-70" />
            ) : null}
            <span className="pointer-events-none absolute inset-y-3 right-0 w-[46%]">
              <SafeImage
                src={cover}
                alt=""
                fill
                sizes="(max-width: 768px) 45vw, 20vw"
                className="object-contain object-right"
              />
            </span>
          </>
        )}
        <span className="relative z-10 flex h-full flex-col justify-end p-4 sm:p-5">
          <span
            className={cn(
              "tabular text-sm opacity-70",
              photoCover && "text-white/80",
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={cn(
              "mt-1 line-clamp-2 font-heading text-[1.2rem] leading-[1.05] font-bold tracking-[-0.04em] sm:text-[1.35rem]",
              photoCover ? "text-white" : darkText && "text-dark-text",
            )}
          >
            {category.name}
          </span>
          {typeof count === "number" ? (
            <span
              className={cn(
                "mt-1 text-sm opacity-75",
                photoCover && "text-white/80",
              )}
            >
              {count} ürün
            </span>
          ) : null}
        </span>
      </span>
    </Link>
  );
}
