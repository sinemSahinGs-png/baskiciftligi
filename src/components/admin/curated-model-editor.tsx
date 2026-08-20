"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ImagePlus, LoaderCircle } from "lucide-react";

import {
  analyzeCuratedSourceAction,
  deleteCuratedModelAction,
  saveCuratedModelAction,
} from "@/app/admin/harici-modeller/actions";
import { initialAdminActionState } from "@/app/admin/admin-state";
import {
  platformLabel,
  slugifyCuratedTitle,
  type CuratedModelRecord,
  type CuratedPlatform,
  type CuratedPublicationStatus,
} from "@/domain/curated-models/types";
import { cn } from "@/lib/utils";

type CategoryOption = { id: string; name: string };

const PLATFORMS: CuratedPlatform[] = [
  "printables",
  "thingiverse",
  "myminifactory",
  "other",
];

const STEPS = [
  { id: 1, label: "Kaynak" },
  { id: 2, label: "Model bilgileri" },
  { id: 3, label: "Görsel" },
  { id: 4, label: "Kontrol ve yayınlama" },
] as const;

export function CuratedModelEditor({
  model,
  categories,
  canPublish,
  draftId,
}: {
  model?: CuratedModelRecord | null;
  categories: CategoryOption[];
  canPublish: boolean;
  draftId: string;
}) {
  const recordId = model?.id ?? draftId;
  const [step, setStep] = useState(1);
  const [platformType, setPlatformType] = useState<CuratedPlatform>(
    model?.platformType && model.platformType !== "studio"
      ? model.platformType
      : "printables",
  );
  const [sourceUrl, setSourceUrl] = useState(model?.sourceUrl ?? "");
  const [titleTr, setTitleTr] = useState(model?.titleTr ?? "");
  const [originalTitle, setOriginalTitle] = useState(model?.originalTitle ?? "");
  const [description, setDescription] = useState(model?.description ?? "");
  const [searchTerms, setSearchTerms] = useState(
    model?.searchTerms?.join(", ") ?? "",
  );
  const [categoryId, setCategoryId] = useState(model?.categoryId ?? "");
  const [authorName, setAuthorName] = useState(model?.authorName ?? "");
  const [licenseCode, setLicenseCode] = useState(model?.licenseCode ?? "");
  const [licenseVerified, setLicenseVerified] = useState(
    Boolean(model?.licenseVerified),
  );
  const [slug, setSlug] = useState(model?.slug ?? "");
  const [previewImageUrl, setPreviewImageUrl] = useState(
    model?.previewImageUrl ?? "",
  );
  const [imageAlt, setImageAlt] = useState(model?.imageAlt ?? "");
  const [status, setStatus] = useState<CuratedPublicationStatus>(
    model?.status ?? "draft",
  );
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [analyzeState, analyzeAction, analyzing] = useActionState(
    analyzeCuratedSourceAction,
    initialAdminActionState,
  );
  const [saveState, saveAction, saving] = useActionState(
    saveCuratedModelAction,
    initialAdminActionState,
  );
  const [pendingDelete, startDelete] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (analyzeState.status !== "success" || !analyzeState.fieldErrors) {
      return;
    }
    const suggestedTitle = analyzeState.fieldErrors.suggestedTitle?.[0];
    const suggestedDescription =
      analyzeState.fieldErrors.suggestedDescription?.[0];
    const canonical = analyzeState.fieldErrors.canonicalUrl?.[0];
    queueMicrotask(() => {
      if (canonical) setSourceUrl(canonical);
      if (suggestedTitle) {
        setOriginalTitle((current) => current || suggestedTitle);
        setTitleTr((current) => current || suggestedTitle);
      }
      if (suggestedDescription) {
        setDescription((current) => current || suggestedDescription);
      }
    });
  }, [analyzeState]);

  const categoryLabel = useMemo(
    () => categories.find((item) => item.id === categoryId)?.name ?? "",
    [categories, categoryId],
  );

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const dims = await readClientImageSize(file);
      if (dims.width < 640 || dims.height < 800) {
        throw new Error(
          `Kapak görseli en az 640×800 olmalıdır (şu an ${dims.width}×${dims.height}).`,
        );
      }
      const body = new FormData();
      body.set("curatedModelId", recordId);
      body.set("file", file);
      const response = await fetch("/api/admin/catalog-media", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as {
        error?: string;
        url?: string;
      };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Yükleme başarısız.");
      }
      setPreviewImageUrl(payload.url);
      if (!imageAlt) {
        setImageAlt(titleTr || file.name.replace(/\.[^.]+$/, ""));
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Yükleme başarısız.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => setStep(item.id)}
              className={cn(
                "min-h-10 rounded-full px-4 text-sm font-semibold",
                step === item.id
                  ? "bg-cyan text-ink"
                  : "border border-white/15 text-muted-foreground",
              )}
            >
              {item.id}. {item.label}
            </button>
          </li>
        ))}
      </ol>

      {analyzeState.message ? (
        <p
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            analyzeState.status === "error"
              ? "border-red-400/40 text-red-200"
              : "border-white/15 text-muted-foreground",
          )}
        >
          {analyzeState.message}
        </p>
      ) : null}
      {saveState.message ? (
        <p
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            saveState.status === "error"
              ? "border-red-400/40 text-red-200"
              : "border-emerald-400/30 text-emerald-100",
          )}
        >
          {saveState.message}
        </p>
      ) : null}

      <form action={saveAction} className="space-y-6">
        <input type="hidden" name="id" value={recordId} />
        <input type="hidden" name="platformType" value={platformType} />
        <input type="hidden" name="sourceUrl" value={sourceUrl} />
        <input type="hidden" name="titleTr" value={titleTr} />
        <input type="hidden" name="originalTitle" value={originalTitle} />
        <input type="hidden" name="description" value={description} />
        <input type="hidden" name="searchTerms" value={searchTerms} />
        <input type="hidden" name="categoryId" value={categoryId} />
        <input type="hidden" name="categoryLabel" value={categoryLabel} />
        <input type="hidden" name="authorName" value={authorName} />
        <input type="hidden" name="licenseCode" value={licenseCode} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="previewImageUrl" value={previewImageUrl} />
        <input type="hidden" name="imageAlt" value={imageAlt} />
        <input type="hidden" name="status" value={status} />
        {licenseVerified ? (
          <input type="hidden" name="licenseVerified" value="on" />
        ) : null}

        {step === 1 ? (
          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">1. Kaynak</h2>
            <label className="block space-y-2 text-sm">
              <span>Kaynak türü</span>
              <select
                value={platformType}
                onChange={(event) =>
                  setPlatformType(event.target.value as CuratedPlatform)
                }
                className="min-h-11 w-full rounded-xl border border-white/15 bg-ink px-3"
              >
                {PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platformLabel(platform)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2 text-sm">
              <span>Kaynak URL</span>
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="https://www.printables.com/model/..."
                className="min-h-11 w-full rounded-xl border border-white/15 bg-ink px-3"
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                formAction={analyzeAction}
                disabled={analyzing || !sourceUrl}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold"
              >
                {analyzing ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                Bağlantıyı analiz et
              </button>
              <p className="text-xs text-muted-foreground">
                Yalnızca Open Graph okunur. Görsel kopyalanmaz; alanlar onayınız
                olmadan yayınlanmaz.
              </p>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">2. Model bilgileri</h2>
            <Field
              label="Türkçe görünen başlık"
              value={titleTr}
              onChange={(value) => {
                setTitleTr(value);
                if (!model?.slug) setSlug(slugifyCuratedTitle(value));
              }}
            />
            <Field
              label="Orijinal başlık"
              value={originalTitle}
              onChange={setOriginalTitle}
            />
            <label className="block space-y-2 text-sm">
              <span>Kısa Türkçe açıklama</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                className="w-full rounded-xl border border-white/15 bg-ink px-3 py-2"
              />
            </label>
            <Field
              label="Arama etiketleri (virgülle)"
              value={searchTerms}
              onChange={setSearchTerms}
              hint="Türkçe aramada bulunur."
            />
            <label className="block space-y-2 text-sm">
              <span>Kategori</span>
              <select
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-white/15 bg-ink px-3"
              >
                <option value="">Seçin</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <Field
              label="Tasarımcı / kaynak sahibi"
              value={authorName}
              onChange={setAuthorName}
            />
            <Field
              label="Lisans (yalnızca doğrulanmışsa işaretleyin)"
              value={licenseCode}
              onChange={setLicenseCode}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={licenseVerified}
                onChange={(event) => setLicenseVerified(event.target.checked)}
              />
              Lisans doğrulandı
            </label>
            <Field
              label="Slug"
              value={slug}
              onChange={setSlug}
              hint="Detay URL: /hazir-modeller/katalog/[slug]"
            />
            <p className="text-sm text-muted-foreground">
              Kaynak sayfası:{" "}
              {sourceUrl ? (
                <a href={sourceUrl} className="underline">
                  {sourceUrl}
                </a>
              ) : (
                "henüz yok"
              )}
            </p>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">3. Görsel</h2>
            <p className="text-sm text-muted-foreground">
              Printables veya başka kaynaktan hotlink/scrape yok. Görseli
              manuel yükleyin (min. 640×800, 4/5 önizleme).
            </p>
            <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
              <div className="aspect-[4/5] overflow-hidden rounded-xl border border-white/15 bg-ink">
                {previewImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewImageUrl}
                    alt={imageAlt || "Kapak önizleme"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">
                    Kapak yok
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => onUpload(event.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan px-4 text-sm font-semibold text-ink"
                >
                  {uploading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <ImagePlus className="size-4" />
                  )}
                  Kapak görseli yükle
                </button>
                {uploadError ? (
                  <p className="text-sm text-red-200">{uploadError}</p>
                ) : null}
                <Field
                  label="Alt metin (zorunlu)"
                  value={imageAlt}
                  onChange={setImageAlt}
                />
              </div>
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-lg font-semibold">4. Kontrol ve yayınlama</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>Başlık: {titleTr || "—"}</li>
              <li>Kategori: {categoryLabel || "—"}</li>
              <li>Kaynak: {sourceUrl || "—"}</li>
              <li>Görsel: {previewImageUrl ? "var" : "yok"}</li>
              <li>Etiketler: {searchTerms || "—"}</li>
            </ul>
            <label className="block space-y-2 text-sm">
              <span>Durum</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as CuratedPublicationStatus)
                }
                className="min-h-11 w-full rounded-xl border border-white/15 bg-ink px-3"
              >
                <option value="draft">Taslak</option>
                {canPublish ? <option value="published">Yayında</option> : null}
                {canPublish ? <option value="archived">Arşiv</option> : null}
              </select>
            </label>
            {!canPublish ? (
              <p className="text-sm text-amber-100/90">
                Editor yalnızca taslak hazırlayabilir. Yayın için owner/admin
                gerekir.
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((value) => Math.max(1, value - 1))}
              className="min-h-11 rounded-xl border border-white/15 px-4 text-sm font-semibold"
            >
              Geri
            </button>
          ) : null}
          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((value) => Math.min(4, value + 1))}
              className="min-h-11 rounded-xl bg-white/10 px-4 text-sm font-semibold"
            >
              İleri
            </button>
          ) : null}
          <button
            type="submit"
            disabled={saving}
            className="min-h-11 rounded-xl bg-cyan px-4 text-sm font-semibold text-ink"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
          <Link
            href="/admin/harici-modeller"
            className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-semibold"
          >
            Listeye dön
          </Link>
        </div>
      </form>

      {model?.id && canPublish ? (
        <form
          action={(formData) => {
            startDelete(() => {
              void deleteCuratedModelAction(formData);
            });
          }}
        >
          <input type="hidden" name="id" value={model.id} />
          <button
            type="submit"
            disabled={pendingDelete}
            className="min-h-11 rounded-xl border border-red-400/40 px-4 text-sm font-semibold text-red-200"
          >
            Sil
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span>{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-white/15 bg-ink px-3"
      />
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function readClientImageSize(file: File) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Görsel okunamadı."));
    };
    image.src = url;
  });
}
