"use client";

import { useState, type FormEvent } from "react";

import { siteConfig } from "@/config/site";

export function CorporateLeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[1.25rem] bg-optical p-6 text-dark-text sm:p-8"
      noValidate={false}
    >
      <h2 className="font-heading text-3xl font-bold">Proje brief’i</h2>
      <p className="mt-3 text-sm leading-6 text-ink-secondary">
        Form, CRM veya e-posta altyapısı bağlı olmadığı için talep oluşturmaz.
        Dosya seçimi yalnızca tarayıcıda kalır.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Ad soyad
          <input
            required
            name="name"
            className="mt-2 h-11 w-full rounded-md border border-hairline bg-elevated px-3 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          Şirket
          <input
            required
            name="company"
            className="mt-2 h-11 w-full rounded-md border border-hairline bg-elevated px-3 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          E-posta
          <input
            required
            type="email"
            name="email"
            className="mt-2 h-11 w-full rounded-md border border-hairline bg-elevated px-3 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          Telefon
          <input
            name="phone"
            className="mt-2 h-11 w-full rounded-md border border-hairline bg-elevated px-3 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          Tahmini adet
          <input
            name="quantity"
            inputMode="numeric"
            className="mt-2 h-11 w-full rounded-md border border-hairline bg-elevated px-3 font-normal"
          />
        </label>
        <label className="text-sm font-semibold">
          Hedef teslim
          <input
            type="date"
            name="deadline"
            className="mt-2 h-11 w-full rounded-md border border-hairline bg-elevated px-3 font-normal"
          />
        </label>
        <label className="sm:col-span-2 text-sm font-semibold">
          Malzeme tercihi
          <select
            name="material"
            className="mt-2 h-11 w-full rounded-md border border-hairline bg-elevated px-3 font-normal"
            defaultValue=""
          >
            <option value="">Henüz karar verilmedi</option>
            <option value="pla">PLA</option>
            <option value="petg">PETG</option>
            <option value="resin">SLA reçine</option>
          </select>
        </label>
        <label className="sm:col-span-2 text-sm font-semibold">
          Proje özeti
          <textarea
            required
            name="summary"
            rows={5}
            className="mt-2 w-full rounded-md border border-hairline bg-elevated px-3 py-2 font-normal"
          />
        </label>
        <label className="sm:col-span-2 text-sm font-semibold">
          Dosya eki (isteğe bağlı)
          <input
            type="file"
            name="attachment"
            accept=".stl,.obj,.3mf,.pdf,.zip"
            className="mt-2 block w-full text-sm font-normal"
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name ?? null)
            }
          />
          <span className="mt-1 block text-xs font-normal text-ink-muted">
            {fileName
              ? `${fileName} seçildi; sunucuya yüklenmez.`
              : "STL, 3MF, OBJ, PDF veya ZIP. Yükleme uç noktası yok."}
          </span>
        </label>
      </div>

      <label className="mt-6 flex items-start gap-3 text-sm leading-6">
        <input required type="checkbox" name="consent" className="mt-1 size-4" />
        <span>
          {siteConfig.name} ile paylaştığım bilgilerin teklif değerlendirmesi
          için kullanılmasını kabul ediyorum. Bu onay, henüz gönderim yapılmadığı
          için kayıt oluşturmaz.
        </span>
      </label>

      <button
        type="submit"
        className="mt-6 inline-flex min-h-12 items-center rounded-md bg-orange px-6 text-sm font-semibold text-dark-text"
      >
        Brief’i hazırla
      </button>

      {submitted ? (
        <p role="status" className="mt-4 rounded-md bg-orange/15 px-4 py-3 text-sm">
          Lead altyapısı henüz bağlı değil. Form gönderilmedi; {siteConfig.name}
          sistemine kayıt yazılmadı.
        </p>
      ) : null}
    </form>
  );
}
