"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { saveSiteContentAction } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SiteContent } from "@/domain/site/content";

export function SiteContentEditor({ initial }: { initial: SiteContent }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<SiteContent>(initial);
  const [error, setError] = useState<string>();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    startTransition(async () => {
      const result = await saveSiteContentAction(form);
      if (result.status === "error") {
        setError(result.message ?? "Kaydedilemedi.");
        toast.error(result.message ?? "Kaydedilemedi.");
        return;
      }
      toast.success(result.message);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-card p-5 sm:p-6">
        <h2 className="font-heading text-xl font-medium">Ana sayfa kahramanı</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Başlık, açıklama ve buton yazıları anında vitrine yansır.
        </p>
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hero-eyebrow">Üst etiket</Label>
            <Input
              id="hero-eyebrow"
              value={form.hero.eyebrow}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hero: { ...current.hero, eyebrow: event.target.value },
                }))
              }
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="hero-headline">Başlık</Label>
            <Input
              id="hero-headline"
              value={form.hero.headline}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hero: { ...current.hero, headline: event.target.value },
                }))
              }
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="hero-description">Açıklama</Label>
            <Textarea
              id="hero-description"
              value={form.hero.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hero: { ...current.hero, description: event.target.value },
                }))
              }
              rows={4}
              className="rounded-xl border-white/12 bg-black/20 px-3 py-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-primary">Birincil buton</Label>
            <Input
              id="hero-primary"
              value={form.hero.primaryCtaLabel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hero: {
                    ...current.hero,
                    primaryCtaLabel: event.target.value,
                  },
                }))
              }
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-secondary">İkincil buton</Label>
            <Input
              id="hero-secondary"
              value={form.hero.secondaryCtaLabel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hero: {
                    ...current.hero,
                    secondaryCtaLabel: event.target.value,
                  },
                }))
              }
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-video">Video URL</Label>
            <Input
              id="hero-video"
              value={form.hero.videoUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hero: { ...current.hero, videoUrl: event.target.value },
                }))
              }
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3 font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hero-poster">Poster URL</Label>
            <Input
              id="hero-poster"
              value={form.hero.posterUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hero: { ...current.hero, posterUrl: event.target.value },
                }))
              }
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3 font-mono text-xs"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-card p-5 sm:p-6">
        <h2 className="font-heading text-xl font-medium">Kategori bölümü</h2>
        <div className="mt-6 grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="categories-title">Başlık</Label>
            <Input
              id="categories-title"
              value={form.categoriesIntroTitle}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  categoriesIntroTitle: event.target.value,
                }))
              }
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="categories-description">Açıklama</Label>
            <Input
              id="categories-description"
              value={form.categoriesIntroDescription}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  categoriesIntroDescription: event.target.value,
                }))
              }
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-card p-5 sm:p-6">
        <h2 className="font-heading text-xl font-medium">Genel metinler</h2>
        <div className="mt-6 grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="tagline">Kısa slogan</Label>
            <Input
              id="tagline"
              value={form.tagline}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tagline: event.target.value,
                }))
              }
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site-description">Site açıklaması</Label>
            <Textarea
              id="site-description"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              className="rounded-xl border-white/12 bg-black/20 px-3 py-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footer-heading">Altbilgi başlığı</Label>
            <Input
              id="footer-heading"
              value={form.footerHeading}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  footerHeading: event.target.value,
                }))
              }
              className="h-11 rounded-xl border-white/12 bg-black/20 px-3"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footer-description">Altbilgi açıklaması</Label>
            <Textarea
              id="footer-description"
              value={form.footerDescription}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  footerDescription: event.target.value,
                }))
              }
              rows={3}
              className="rounded-xl border-white/12 bg-black/20 px-3 py-3"
            />
          </div>
        </div>
      </section>

      {error ? (
        <p
          className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-cyan px-6 text-sm font-bold text-ink hover:bg-[#63e2ff] disabled:opacity-50"
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Check className="size-4" aria-hidden="true" />
        )}
        {pending ? "Kaydediliyor…" : "Vitrin metinlerini kaydet"}
      </button>
    </form>
  );
}
