"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function QuoteCtaButton({
  onClick,
  loading = false,
  success = false,
  disabled = false,
  variant = "default",
  className,
  "data-testid": dataTestId,
  label,
  mobileLabel,
}: {
  onClick: () => void;
  loading?: boolean;
  success?: boolean;
  disabled?: boolean;
  variant?: "default" | "sticky";
  className?: string;
  "data-testid"?: string;
  label?: string;
  mobileLabel?: string;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const ctaLabel =
    variant === "sticky"
      ? (mobileLabel ?? label ?? "Dosya Yükle, Fiyatı Gör")
      : (label ?? "Dosyayı Yükle ve Fiyatı Gör");

  return (
    <button
      type="button"
      data-production-request-cta=""
      data-testid={dataTestId}
      disabled={disabled || loading || success}
      onClick={onClick}
      className={cn(
        "group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-coral font-semibold text-midnight transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-carbon disabled:pointer-events-none disabled:opacity-60",
        variant === "sticky"
          ? "min-h-12 px-4 text-base shadow-none active:scale-[0.99]"
          : "min-h-12 px-5 text-base shadow-[0_8px_24px_-12px_rgba(255,107,74,0.8)] hover:-translate-y-0.5 hover:brightness-105 hover:shadow-[0_12px_28px_-10px_rgba(255,107,74,0.85)] active:translate-y-0 active:scale-[0.99] sm:min-h-[3.5rem]",
        className,
      )}
    >
      {!reducedMotion ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full animate-[quote-shine_5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
      ) : null}
      {loading ? (
        <>
          <Loader2 aria-hidden="true" className="size-5 animate-spin" />
          Gönderiliyor…
        </>
      ) : success ? (
        <>
          <Check aria-hidden="true" className="size-5" />
          Talebin alındı
        </>
      ) : (
        <>
          {ctaLabel}
          <ArrowRight
            aria-hidden="true"
            className="size-5 transition-transform duration-200 group-hover:translate-x-1"
          />
        </>
      )}
    </button>
  );
}
