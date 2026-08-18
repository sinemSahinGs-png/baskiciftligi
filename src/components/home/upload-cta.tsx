"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  FileBox,
  UploadCloud,
} from "lucide-react";

import { cn } from "@/lib/utils";

const modelRoute = "/model-yukle" as Route;
const maxBytes = 100 * 1024 * 1024;
const allowedExtensions = [".stl", ".obj", ".3mf"];

function isAllowedFile(file: File) {
  const name = file.name.toLowerCase();
  return allowedExtensions.some((extension) => name.endsWith(extension));
}

export function UploadCta() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [routing, setRouting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function continueWithFiles(files: FileList | null) {
    if (!files?.length || routing) {
      return;
    }

    const file = files[0];
    if (!file) {
      return;
    }

    if (!isAllowedFile(file)) {
      setError("Yalnızca STL, 3MF veya OBJ dosyaları seçilebilir.");
      return;
    }

    if (file.size > maxBytes) {
      setError("Dosya 100 MB sınırını aşıyor. Daha küçük bir dosya seç.");
      return;
    }

    setError(null);
    setRouting(true);
    setProgress(18);

    const timer = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 92) {
          window.clearInterval(timer);
          return 92;
        }
        return value + 14;
      });
    }, 90);

    window.setTimeout(() => {
      window.clearInterval(timer);
      setProgress(100);
      router.push(modelRoute);
    }, 720);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    continueWithFiles(event.dataTransfer.files);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    continueWithFiles(event.target.files);
  }

  return (
    <section className="section-space relative overflow-hidden border-y border-white/10 bg-[#0b0f13]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_40%,rgba(33,212,253,0.11),transparent_34%),radial-gradient(circle_at_90%_70%,rgba(255,122,61,0.08),transparent_30%)]"
      />
      <div className="shell relative grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <div>
          <p className="eyebrow">Kendi modelin</p>
          <h2 className="section-title mt-5">Modelin hazır mı?</h2>
          <p className="body-large mt-5 max-w-xl">
            STL, 3MF veya OBJ dosyanı yükle; malzeme, renk ve adet seçeneklerine
            göre fiyatını hesaplayalım.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            Phase 1’de dosya sunucuya aktarılmaz ve otomatik dilimleme çalışmaz.
            Seçim, yapılandırıcı akışına geçişi başlatır.
          </p>
        </div>

        <div>
          <label
            htmlFor="home-model-file"
            onDragEnter={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "copy";
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "group relative flex min-h-[22rem] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-dashed p-6 text-center transition-[border-color,background-color,transform] duration-300 sm:min-h-[24rem] sm:p-8",
              dragging
                ? "scale-[1.01] border-cyan bg-cyan/[0.09]"
                : "border-white/22 bg-white/[0.025] hover:border-cyan/55 hover:bg-cyan/[0.045]",
              routing && "pointer-events-none",
            )}
          >
            <input
              id="home-model-file"
              type="file"
              accept=".stl,.obj,.3mf,model/stl,model/obj"
              onChange={handleChange}
              disabled={routing}
              className="sr-only"
              aria-describedby="home-model-file-note"
            />

            <span
              aria-hidden="true"
              className="animate-float pointer-events-none absolute top-[12%] size-28 opacity-70 motion-reduce:animate-none"
            >
              <span className="absolute inset-0 bg-[linear-gradient(125deg,#1f6a79,#21d4fd_46%,#0c5467)] [clip-path:polygon(50%_0,78%_18%,92%_52%,70%_100%,30%_100%,8%_52%,22%_18%)]" />
              <span className="absolute inset-0 [background-image:repeating-linear-gradient(0deg,rgba(8,10,13,.45)_0,rgba(8,10,13,.45)_1px,transparent_1px,transparent_6px)] opacity-50 [clip-path:polygon(50%_0,78%_18%,92%_52%,70%_100%,30%_100%,8%_52%,22%_18%)]" />
            </span>

            <span className="relative grid size-20 place-items-center rounded-full border border-cyan/25 bg-cyan/10 text-cyan shadow-[0_0_50px_rgba(33,212,253,0.12)]">
              <UploadCloud className="size-8" />
            </span>
            <span className="mt-6 font-heading text-2xl font-medium sm:text-[1.7rem]">
              {routing
                ? "Yapılandırıcıya geçiliyor…"
                : "Dosyayı sürükle veya seç"}
            </span>
            <span className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Dosya bu sayfada kaydedilmez. Seçim yalnızca Model Yükle
              sayfasına yönlendirir.
            </span>
            <span className="mt-5 inline-flex min-h-11 items-center rounded-full border border-white/12 bg-white/[0.05] px-5 text-sm font-bold">
              Dosya seç
            </span>
            <span
              id="home-model-file-note"
              className="mt-4 text-[0.72rem] font-semibold tracking-[0.08em] text-foreground/65 uppercase"
            >
              STL · 3MF · OBJ · En fazla 100 MB
            </span>

            {routing ? (
              <span className="mt-5 w-full max-w-xs">
                <span className="sr-only">Yönlendirme hazırlanıyor</span>
                <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
                  <span
                    className="block h-full rounded-full bg-cyan transition-[width] duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              </span>
            ) : null}
          </label>

          {error ? (
            <p
              role="alert"
              className="mt-4 inline-flex items-start gap-2 text-sm text-destructive"
            >
              <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {error}
            </p>
          ) : (
            <div className="mt-4 flex flex-col gap-2 px-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-2">
                <FileBox aria-hidden="true" className="size-4 text-cyan" />
                Dilimleme ve fiyat motoru henüz bağlı değil
              </span>
              <Link
                href={"/hazir-modeller" as Route}
                className="inline-flex min-h-11 items-center gap-1.5 font-bold text-foreground transition-colors hover:text-cyan"
              >
                Modellere bak
                <ArrowUpRight aria-hidden="true" className="size-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
