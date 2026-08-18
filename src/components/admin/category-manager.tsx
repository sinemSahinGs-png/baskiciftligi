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
import { SafeImage } from "@/components/media/safe-image";
import type { AdminCategory } from "@/domain/catalog/admin-types";
import {
  categoryImageFitClass,
  categoryImageStyle,
  formatObjectPosition,
  parseObjectPosition,
  resolveCategoryImagePresentation,
} from "@/lib/catalog/category-image";
import type { CategoryFormInput } from "@/lib/validation/catalog";
import { cn } from "@/lib/utils";

interface CategoryManagerProps {
  categories: AdminCategory[];
}

const emptyCategory: CategoryFormInput = {
  name: "",
  slug: "",
  description: "",
  eyebrow: "",
  imageUrl: "",
  imageFit: "cover",
  imageScale: 100,
  objectPosition: "50% 50%",
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
  const [coverError, setCoverError] = useState<string>();

  function resetForm() {
    setForm({
      ...emptyCategory,
      position: categories.length
        ? Math.max(...categories.map((category) => category.position)) + 1
        : 0,
    });
    setSlugEdited(false);
    setFormError(undefined);
    setCoverError(undefined);
  }

  function edit(category: AdminCategory) {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      eyebrow: category.eyebrow,
      imageUrl: category.imageUrl,
      imageFit: category.imageFit,
      imageScale: category.imageScale,
      objectPosition: category.objectPosition,
      status: category.status,
      position: category.position,
    });
    setSlugEdited(true);
    setFormError(undefined);
    setCoverError(undefined);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function uploadCover(file: File) {
    const slug = form.slug.trim() || slugify(form.name);
    if (!slug) {
      setCoverError("PNG yüklemek için önce kategori adını veya slug’ı girin.");
      return;
    }
    if (file.type && file.type !== "image/png") {
      setCoverError("Kategori kapağı yalnızca PNG kabul eder.");
      return;
    }

    setCoverError(undefined);
    const body = new FormData();
    body.set("slug", slug);
    body.set("file", file);

    try {
      const response = await fetch("/api/admin/category-cover", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setCoverError(payload.error ?? "PNG yüklenemedi.");
        return;
      }
      const coverUrl = payload.url;
      setForm((current) => ({
        ...current,
        slug: current.slug || slug,
        imageUrl: coverUrl,
      }));
      if (!slugEdited && !form.slug) {
        setSlugEdited(true);
      }
    } catch {
      setCoverError("PNG yüklenemedi.");
    }
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
            <Label htmlFor="category-eyebrow">Kısa etiket</Label>
            <Input
              id="category-eyebrow"
              value={form.eyebrow ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  eyebrow: event.target.value,
                }))
              }
              placeholder="Koleksiyon"
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category-image-file">Kapak görseli (PNG)</Label>
            <Input
              id="category-image-file"
              type="file"
              accept="image/png,.png"
              disabled={pending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) {
                  void uploadCover(file);
                }
              }}
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-cyan file:px-3 file:py-1 file:text-xs file:font-semibold file:text-ink"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Yalnızca PNG. Dosya{" "}
              <code>
                public/demo/categories/
                {form.slug || "kategori-slug"}
                .png
              </code>{" "}
              olarak kaydedilir. JPEG veya SVG kabul edilmez.
            </p>
            {coverError ? (
              <p className="text-xs text-destructive" role="alert">
                {coverError}
              </p>
            ) : null}
            <CategoryCoverPreview form={form} />
            <ImageFramingControls
              form={form}
              onChange={(patch) =>
                setForm((current) => ({ ...current, ...patch }))
              }
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
              placeholder="/demo/categories/ev-ve-dekorasyon.png"
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
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
                <div className="grid size-14 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  {category.imageUrl ? (
                    <span className="relative size-full">
                      <SafeImage
                        src={category.imageUrl}
                        alt=""
                        fill
                        sizes="56px"
                        className={categoryImageFitClass(category.imageFit)}
                        style={categoryImageStyle(
                          resolveCategoryImagePresentation(category),
                        )}
                      />
                    </span>
                  ) : (
                    <span className="font-heading text-lg text-cyan">
                      {category.position}
                    </span>
                  )}
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

function CategoryCoverPreview({ form }: { form: CategoryFormInput }) {
  if (!form.imageUrl) {
    return (
      <div className="mt-2 grid aspect-[4/3] place-items-center rounded-xl border border-dashed border-white/12 bg-black/20 text-xs text-muted-foreground">
        PNG yükleyince vitrin önizlemesi burada görünür.
      </div>
    );
  }

  const presentation = resolveCategoryImagePresentation(form);

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <p className="px-3 py-2 text-[0.65rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">
        Vitrin önizlemesi
      </p>
      <div className="relative aspect-[4/3] overflow-hidden">
        <SafeImage
          src={form.imageUrl}
          alt=""
          fill
          sizes="420px"
          className={categoryImageFitClass(presentation.fit)}
          style={categoryImageStyle(presentation)}
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        <span className="absolute inset-x-0 bottom-0 z-10 p-4">
          <span className="block font-heading text-lg font-bold text-white">
            {form.name || "Kategori adı"}
          </span>
        </span>
      </div>
    </div>
  );
}

function ImageFramingControls({
  form,
  onChange,
}: {
  form: CategoryFormInput;
  onChange: (patch: Partial<CategoryFormInput>) => void;
}) {
  const presentation = resolveCategoryImagePresentation(form);
  const position = parseObjectPosition(form.objectPosition);

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs font-semibold">Görselin vitrinde duruşu</p>
      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ["cover", "Kapla"],
            ["contain", "Sığdır"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange({ imageFit: value })}
            className={cn(
              "min-h-10 rounded-full border px-3 text-xs font-semibold",
              presentation.fit === value
                ? "border-cyan bg-cyan text-ink"
                : "border-white/12 text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="block space-y-2 text-xs">
        <span className="flex justify-between text-muted-foreground">
          Ölçek
          <span className="tabular text-foreground">{presentation.scale}%</span>
        </span>
        <input
          type="range"
          min={50}
          max={200}
          step={1}
          value={presentation.scale}
          onChange={(event) =>
            onChange({ imageScale: Number(event.target.value) })
          }
          className="w-full accent-cyan"
        />
      </label>
      <label className="block space-y-2 text-xs">
        <span className="flex justify-between text-muted-foreground">
          Yatay konum
          <span className="tabular text-foreground">{position.x}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={position.x}
          onChange={(event) =>
            onChange({
              objectPosition: formatObjectPosition(
                Number(event.target.value),
                position.y,
              ),
            })
          }
          className="w-full accent-cyan"
        />
      </label>
      <label className="block space-y-2 text-xs">
        <span className="flex justify-between text-muted-foreground">
          Dikey konum
          <span className="tabular text-foreground">{position.y}%</span>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={position.y}
          onChange={(event) =>
            onChange({
              objectPosition: formatObjectPosition(
                position.x,
                Number(event.target.value),
              ),
            })
          }
          className="w-full accent-cyan"
        />
      </label>
    </div>
  );
}

