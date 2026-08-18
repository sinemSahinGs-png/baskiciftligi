"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteCategoryAction,
  saveCategoryAction,
} from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminCategory } from "@/domain/catalog/admin-types";
import type { CategoryFormInput } from "@/lib/validation/catalog";

interface CategoryManagerProps {
  categories: AdminCategory[];
}

const emptyCategory: CategoryFormInput = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  status: "published",
  position: 0,
};

function slugify(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<CategoryFormInput>({
    ...emptyCategory,
    position: categories.length
      ? Math.max(...categories.map((category) => category.position)) + 1
      : 0,
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [formError, setFormError] = useState<string>();

  function resetForm() {
    setForm({
      ...emptyCategory,
      position: categories.length
        ? Math.max(...categories.map((category) => category.position)) + 1
        : 0,
    });
    setSlugEdited(false);
    setFormError(undefined);
  }

  function edit(category: AdminCategory) {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.imageUrl,
      status: category.status,
      position: category.position,
    });
    setSlugEdited(true);
    setFormError(undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(undefined);

    startTransition(async () => {
      const result = await saveCategoryAction(form);
      if (result.status === "error") {
        setFormError(result.message ?? "Kategori kaydedilemedi.");
        toast.error(result.message ?? "Kategori kaydedilemedi.");
        return;
      }

      toast.success(result.message);
      resetForm();
      router.refresh();
    });
  }

  function remove(category: AdminCategory) {
    if (
      !window.confirm(
        `“${category.name}” kategorisi kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (result.status === "error") {
        toast.error(result.message ?? "Kategori silinemedi.");
        return;
      }

      if (form.id === category.id) {
        resetForm();
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(20rem,0.72fr)_minmax(0,1.28fr)]">
      <form
        onSubmit={submit}
        className="rounded-3xl border border-white/10 bg-card p-5 sm:p-6 xl:sticky xl:top-24"
      >
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-[0.65rem] font-bold tracking-[0.13em] text-cyan uppercase">
              {form.id ? "Düzenleme" : "Yeni kayıt"}
            </p>
            <h2 className="mt-2 font-heading text-xl font-medium">
              {form.id ? "Kategoriyi düzenle" : "Kategori oluştur"}
            </h2>
          </div>
          {form.id ? (
            <button
              type="button"
              onClick={resetForm}
              className="grid size-9 place-items-center rounded-full border border-white/12 text-muted-foreground hover:text-foreground"
              aria-label="Yeni kategori formuna dön"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="category-name">Kategori adı</Label>
            <Input
              id="category-name"
              value={form.name}
              onChange={(event) => {
                const name = event.target.value;
                setForm((current) => ({
                  ...current,
                  name,
                  slug: slugEdited ? current.slug : slugify(name),
                }));
              }}
              required
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-slug">Slug</Label>
            <Input
              id="category-slug"
              value={form.slug}
              onChange={(event) => {
                setSlugEdited(true);
                setForm((current) => ({
                  ...current,
                  slug: slugify(event.target.value),
                }));
              }}
              required
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3 font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-description">Açıklama</Label>
            <Textarea
              id="category-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={5}
              className="min-h-32 rounded-xl border-white/12 bg-black/20 px-3 py-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-image">Kapak görseli URL</Label>
            <Input
              id="category-image"
              value={form.imageUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
              placeholder="https://… veya /demo/…"
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Dosya yükleme bu fazda yok; yalnızca URL kaydedilir.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-position">Sıra</Label>
            <Input
              id="category-position"
              type="number"
              min={0}
              value={form.position}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  position: Number(event.target.value),
                }))
              }
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
          </div>
        </div>

        {formError ? (
          <p
            className="mt-5 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-cyan px-5 text-sm font-bold text-ink hover:bg-[#63e2ff] disabled:opacity-50"
        >
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          ) : form.id ? (
            <Check className="size-4" aria-hidden="true" />
          ) : (
            <Plus className="size-4" aria-hidden="true" />
          )}
          {pending
            ? "Kaydediliyor…"
            : form.id
              ? "Değişiklikleri kaydet"
              : "Kategori oluştur"}
        </button>
      </form>

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-card">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">Kategori dizini</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {categories.length} kategori
            </p>
          </div>
        </div>
        {categories.length ? (
          <ul className="divide-y divide-white/8">
            {categories.map((category) => (
              <li
                key={category.id}
                className="grid gap-4 p-5 md:grid-cols-[4rem_minmax(0,1fr)_auto] md:items-center"
              >
                <div className="grid size-14 place-items-center rounded-2xl border border-white/10 bg-black/20 font-heading text-lg text-cyan">
                  {category.position}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{category.name}</h3>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[0.62rem] text-muted-foreground">
                      {category.status === "published"
                        ? "Yayında"
                        : category.status === "archived"
                          ? "Arşiv"
                          : "Taslak"}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[0.68rem] text-muted-foreground">
                    /{category.slug}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {category.description || "Açıklama girilmedi."}
                  </p>
                  <p className="mt-2 text-[0.68rem] font-semibold text-cyan">
                    {category.productCount} ürün ataması
                  </p>
                </div>
                <div className="flex gap-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => edit(category)}
                    disabled={pending}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/12 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(category)}
                    disabled={pending}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-destructive/20 px-3 text-xs font-semibold text-destructive disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Sil
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center">
            <h3 className="font-heading text-xl font-medium">
              Henüz kategori yok
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              İlk kategori kaydınızı soldaki formdan oluşturun.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
