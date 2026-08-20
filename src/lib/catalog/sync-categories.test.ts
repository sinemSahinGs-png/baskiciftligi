import { describe, expect, it } from "vitest";

import { listCanonicalCategories } from "@/lib/catalog/canonical-categories";
import {
  buildCategoryUpsertRow,
  planCategorySync,
  type HostedCategoryRow,
} from "@/lib/catalog/sync-categories";

describe("canonical category sync", () => {
  it("lists eight homepage categories in storefront order", () => {
    const categories = listCanonicalCategories();
    expect(categories).toHaveLength(8);
    expect(categories.map((category) => category.slug)).toEqual([
      "ev-ve-dekorasyon",
      "biblo-ve-heykel",
      "anahtarlik",
      "magnet",
      "masaustu-aksesuarlari",
      "kisiye-ozel-urunler",
      "fonksiyonel-parcalar",
      "kurumsal-promosyon",
    ]);
    expect(categories[4]?.name).toBe("Masaüstü Aksesuarları");
    expect(categories.every((category) => category.imageUrl.startsWith("/demo/"))).toBe(
      true,
    );
  });

  it("creates rows when hosted categories are empty", () => {
    const plan = planCategorySync({ hosted: [], dryRun: true });
    expect(plan.created).toBe(8);
    expect(plan.updated).toBe(0);
    expect(plan.skipped).toBe(0);
    expect(plan.decisions[0]?.operation).toBe("create");
    expect(plan.decisions[0]?.imageUrl).toBe(
      "/demo/categories/ev-ve-dekorasyon.png",
    );
  });

  it("preserves non-empty hosted fields and skips unchanged rows", () => {
    const hosted: HostedCategoryRow = {
      id: "11111111-1111-4111-8111-111111111111",
      slug: "masaustu-aksesuarlari",
      name: "Masaüstü Aksesuarları",
      description: "Özel açıklama",
      image_url: "/demo/categories/masaustu-aksesuarlari.png",
      seo_title: "Çalışma alanı",
      status: "published",
      position: 5,
      stage_preset: "cobalt",
      active: true,
      published_at: "2026-01-01T00:00:00.000Z",
      sort_order: 5,
    };

    const { row, changes } = buildCategoryUpsertRow(
      listCanonicalCategories()[4]!,
      hosted,
    );

    expect(row.description).toBe("Özel açıklama");
    expect(row.image_url).toBe("/demo/categories/masaustu-aksesuarlari.png");
    expect(changes).toEqual([]);

    const plan = planCategorySync({
      hosted: [hosted],
      dryRun: true,
    });
    expect(plan.created).toBe(7);
    expect(plan.updated).toBe(0);
    expect(plan.skipped).toBe(1);
  });

  it("updates draft hosted rows to published without overwriting artwork", () => {
    const hosted: HostedCategoryRow = {
      id: "22222222-2222-4222-8222-222222222222",
      slug: "magnet",
      name: "Magnet",
      description: "",
      image_url: "",
      seo_title: "",
      status: "draft",
      position: 99,
      stage_preset: null,
      active: false,
      published_at: null,
      sort_order: 99,
    };

    const { row, changes } = buildCategoryUpsertRow(
      listCanonicalCategories()[3]!,
      hosted,
    );

    expect(row.image_url).toBe("/demo/categories/magnet.png");
    expect(row.status).toBe("published");
    expect(row.active).toBe(true);
    expect(changes).toContain("status");
    expect(changes).toContain("image_url");
  });
});
