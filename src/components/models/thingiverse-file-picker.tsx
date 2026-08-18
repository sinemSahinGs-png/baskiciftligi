"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

interface PrintableFile {
  id: string;
  name: string;
  size: number | null;
  formattedSize: string | null;
  format: string | null;
}

export function ThingiverseFilePicker({
  thingId,
  automaticAllowed,
}: {
  thingId: string;
  automaticAllowed: boolean;
}) {
  const [files, setFiles] = useState<PrintableFile[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/models/thingiverse/${thingId}/files`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload: { files?: PrintableFile[]; error?: string }) => {
        setFiles(payload.files ?? []);
        setError(payload.error ?? null);
        if ((payload.files ?? []).length === 1) {
          setSelected(payload.files![0]!.id);
        }
      })
      .catch(() => setError("Dosya listesi alınamadı."));
    return () => controller.abort();
  }, [thingId]);

  if (error) {
    return <p className="text-sm text-error">{error}</p>;
  }
  if (!files) {
    return <p className="text-sm text-muted-light">Yazdırılabilir dosyalar yükleniyor.</p>;
  }
  if (files.length === 0) {
    return (
      <p className="text-sm text-muted-light">
        Bu kayıtta desteklenen STL/OBJ/3MF dosyası yok. İlk STL otomatik seçilmez.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold">Yazdırılabilir dosya seçin</p>
      {files.length > 1 ? (
        <p className="text-xs text-muted-light">
          Birden fazla parça varsa her dosya ayrı üretim işidir. İlk dosya
          otomatik seçilmez.
        </p>
      ) : null}
      <ul className="space-y-2">
        {files.map((file) => (
          <li key={file.id}>
            <label className="flex min-h-11 items-center gap-3 rounded-md border border-white/12 px-3 text-sm">
              <input
                type="radio"
                name="tv-file"
                checked={selected === file.id}
                onChange={() => setSelected(file.id)}
              />
              <span className="min-w-0">
                <span className="block truncate font-medium">{file.name}</span>
                <span className="text-xs text-muted-light">
                  {(file.format ?? "").toUpperCase()}
                  {file.formattedSize ? ` · ${file.formattedSize}` : ""}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      {automaticAllowed && selected ? (
        <Link
          href={
            `/model-yukle?source=thingiverse&thing=${thingId}&file=${selected}` as Route
          }
          className="inline-flex min-h-12 w-full items-center justify-center rounded-md bg-cobalt text-sm font-semibold text-light-text"
        >
          Seçilen dosyayla üretim yapılandır
        </Link>
      ) : (
        <p className="text-sm leading-6">
          {automaticAllowed
            ? "Dilimleme için bir dosya seçin."
            : "Model incelenebilir; ticari üretim otomatik satışa kapalıdır."}
        </p>
      )}
    </div>
  );
}
