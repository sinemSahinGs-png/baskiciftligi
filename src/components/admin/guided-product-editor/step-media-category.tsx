"use client";

import type { AdminCategory } from "@/domain/catalog/admin-types";
import type {
  FieldArrayWithId,
  UseFieldArrayReturn,
  UseFormSetValue,
} from "react-hook-form";

import type { ProductFormInput } from "@/lib/validation/catalog";

import { CategoryPicker } from "./category-picker";
import { GuidedMediaUploader } from "./guided-media-uploader";
import { StepPanel } from "./form-primitives";

type StepMediaCategoryProps = {
  productId: string;
  categories: AdminCategory[];
  categorySlugs: string[];
  onSelectPrimary: (slug: string) => void;
  onToggleAdditional: (slug: string) => void;
  fields: FieldArrayWithId<ProductFormInput, "media", "id">[];
  mediaArray: UseFieldArrayReturn<ProductFormInput, "media", "id">;
  setValue: UseFormSetValue<ProductFormInput>;
  watchedName: string;
  previewValues: ProductFormInput;
  categoryError?: string;
  mediaUploading?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

export function StepMediaCategory({
  productId,
  categories,
  categorySlugs,
  onSelectPrimary,
  onToggleAdditional,
  fields,
  mediaArray,
  setValue,
  watchedName,
  categoryError,
  onUploadingChange,
}: StepMediaCategoryProps) {
  const primarySlug = categorySlugs[0] ?? null;
  const additionalSlugs = categorySlugs.slice(1);

  return (
    <StepPanel
      stepId="editor-step-2"
      active
      title="Görsel ve kategori"
      description="Kapak görselini yükleyin ve ürünün ana kategorisini seçin."
    >
      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-sm font-semibold">Görseller</h3>
          <GuidedMediaUploader
            productId={productId}
            fields={fields}
            mediaArray={mediaArray}
            setValue={setValue}
            watchedName={watchedName}
            onUploadingChange={onUploadingChange}
          />
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Ana kategori</h3>
          <CategoryPicker
            categories={categories}
            primarySlug={primarySlug}
            additionalSlugs={additionalSlugs}
            onSelectPrimary={onSelectPrimary}
            onToggleAdditional={onToggleAdditional}
            error={categoryError}
          />
        </div>
      </div>
    </StepPanel>
  );
}
