"use client";

import type { UseFormRegister, FieldErrors } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { slugifyTurkish } from "@/lib/catalog/slug";
import type { ProductFormInput } from "@/lib/validation/catalog";

import {
  CharacterCounter,
  FieldError,
  StepPanel,
  inputClass,
} from "./form-primitives";

type StepBasicsProps = {
  register: UseFormRegister<ProductFormInput>;
  errors: FieldErrors<ProductFormInput>;
  slugWasEdited: boolean;
  onSlugEdited: () => void;
  onNameChange: (name: string) => void;
  shortDescriptionValue: string;
  descriptionValue: string;
  slugValue: string;
};

export function StepBasics({
  register,
  errors,
  slugWasEdited,
  onSlugEdited,
  onNameChange,
  shortDescriptionValue,
  descriptionValue,
  slugValue,
}: StepBasicsProps) {
  const nameField = register("name");

  return (
    <StepPanel
      stepId="editor-step-1"
      active
      title="Temel bilgiler"
      description="Ürünün mağazada görünecek adını ve tanımını girin."
    >
      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="name">Ürün adı</Label>
          <Input
            id="name"
            {...nameField}
            placeholder="Örn. Kobalt Gözlük Standı"
            className={inputClass}
            aria-invalid={Boolean(errors.name)}
            onChange={(event) => {
              nameField.onChange(event);
              onNameChange(event.target.value);
            }}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription">Kısa açıklama</Label>
          <Textarea
            id="shortDescription"
            {...register("shortDescription")}
            rows={3}
            placeholder="Mağaza kartında görünen tek cümlelik tanım."
            className="min-h-24 rounded-xl border-white/12 bg-black/20 px-3 py-3"
          />
          <CharacterCounter value={shortDescriptionValue} max={320} warnAt={260} />
          <FieldError message={errors.shortDescription?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Ürün açıklaması</Label>
          <Textarea
            id="description"
            {...register("description")}
            rows={5}
            placeholder="Malzeme, kullanım alanı veya kişiselleştirme seçeneklerini anlatabilirsiniz."
            className="min-h-36 rounded-xl border-white/12 bg-black/20 px-3 py-3"
          />
          <CharacterCounter value={descriptionValue} max={20_000} warnAt={600} />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="slug">Adres (slug)</Label>
            {!slugWasEdited && slugValue ? (
              <span className="text-[0.65rem] font-semibold tracking-[0.08em] text-cyan uppercase">
                Otomatik oluşturuldu
              </span>
            ) : null}
          </div>
          <Input
            id="slug"
            {...register("slug")}
            className={inputClass}
            onChange={(event) => {
              onSlugEdited();
              event.target.value = slugifyTurkish(event.target.value);
            }}
          />
          <FieldError message={errors.slug?.message} />
        </div>
      </div>
    </StepPanel>
  );
}
