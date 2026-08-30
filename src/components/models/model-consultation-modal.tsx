"use client";

import { useState } from "react";

import type { ProductionOptionsValue } from "@/components/models/print-production-options";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ModelConsultationModal({
  open,
  onOpenChange,
  model,
  productionOptions,
  estimatedGrossMinor,
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
  estimatedGrossMinor: number | null;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
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
          customerName: name,
          customerPhone: phone,
          customerEmail: email || null,
          material: productionOptions.material,
          color: productionOptions.color,
          sizePreset: productionOptions.sizePreset,
          quantity: productionOptions.quantity,
          customerNote: note || null,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-carbon text-light-text">
        <DialogHeader>
          <DialogTitle>Üretim uygunluğunu danış</DialogTitle>
          <DialogDescription className="text-muted-light">
            Ödeme alınmaz. Talebiniz incelendikten sonra size dönüş yapılır.
          </DialogDescription>
        </DialogHeader>
        {done ? (
          <p className="text-sm leading-6">
            Talebiniz incelemeye alındı. Üretim ve lisans uygunluğu kontrol
            edildikten sonra sizinle iletişime geçeceğiz.
          </p>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <input type="hidden" value={estimatedGrossMinor ?? ""} readOnly />
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
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="min-h-11 w-full rounded-lg border border-white/15 bg-midnight/40 px-3"
              />
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
              <span className="mb-1 block">Not</span>
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
              {submitting ? "Gönderiliyor…" : "Talebi gönder"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
