"use client";

import { useEffect, useRef, useState } from "react";

import type { ProductionOptionsValue } from "@/components/models/print-production-options";
import type { PricingState } from "@/domain/external-models/pricing-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function normalizeTurkishPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+9${digits}`;
  if (digits.length === 10 && digits.startsWith("5")) return `+90${digits}`;
  return raw.trim();
}

function isValidPhone(raw: string) {
  const normalized = normalizeTurkishPhone(raw);
  return /^\+90\d{10}$/.test(normalized);
}

export function ModelConsultationModal({
  open,
  onOpenChange,
  model,
  productionOptions,
  pricingState = "unanalysed",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  model: {
    source: string;
    externalId: string;
    title: string;
    creatorName: string;
    sourceUrl: string;
    licenseLabel?: string | null;
    licenseCode?: string | null;
    thumbnailUrl?: string | null;
  };
  productionOptions: ProductionOptionsValue;
  pricingState?: PricingState;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    openerRef.current?.focus();
    return undefined;
  }, [open]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      setDone(false);
      setError(null);
      setPhoneError(null);
      setSubmitting(false);
    }
    onOpenChange(next);
  }

  async function submit() {
    if (submitting || done) return;
    const normalizedPhone = normalizeTurkishPhone(phone);
    if (!isValidPhone(phone)) {
      setPhoneError("Geçerli bir Türkiye cep telefonu girin (ör. 05xx xxx xx xx).");
      return;
    }
    setPhoneError(null);
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/hazir-modeller/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          source: model.source,
          externalId: model.externalId,
          modelTitle: model.title,
          creatorName: model.creatorName,
          sourceUrl: model.sourceUrl,
          licenseLabel: model.licenseLabel,
          licenseCode: model.licenseCode,
          thumbnailUrl: model.thumbnailUrl,
          customerName: name.trim(),
          customerPhone: normalizedPhone,
          customerEmail: email.trim() || null,
          material: productionOptions.material,
          color: productionOptions.color,
          sizePreset: productionOptions.sizePreset,
          quantity: productionOptions.quantity,
          customerNote: note.trim() || null,
          pricingState,
        }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Talep gönderilemedi.");
        return;
      }
      setDone(true);
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-carbon text-light-text sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Baskı teklifi al</DialogTitle>
          <DialogDescription className="text-muted-light">
            İletişim bilgilerini bırak; seçtiğin model ve baskı tercihlerin talebine otomatik
            eklensin.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="space-y-2 text-sm leading-6">
            <p className="font-semibold text-light-text">Talebin alındı</p>
            <p className="text-muted-light">
              Model ve baskı tercihlerin incelendikten sonra seninle iletişime geçeceğiz.
            </p>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <label className="block text-sm">
              <span className="mb-1 block">Ad soyad</span>
              <input
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-white/15 bg-midnight/40 px-3"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block">Telefon</span>
              <input
                required
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  if (phoneError) setPhoneError(null);
                }}
                placeholder="05xx xxx xx xx"
                className="min-h-11 w-full rounded-lg border border-white/15 bg-midnight/40 px-3"
              />
              {phoneError ? <p className="mt-1 text-xs text-error">{phoneError}</p> : null}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block">E-posta (opsiyonel)</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-white/15 bg-midnight/40 px-3"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block">Not (opsiyonel)</span>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/15 bg-midnight/40 px-3 py-2"
              />
            </label>
            {error ? <p className="text-sm text-error">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-coral text-sm font-semibold text-midnight disabled:opacity-50"
            >
              {submitting ? "Gönderiliyor…" : "Teklif iste"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
