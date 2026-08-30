"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { SafeImage } from "@/components/media/safe-image";
import {
  licenseEvaluationGuidance,
  licenseEvaluationLabel,
} from "@/domain/consultation/license-evaluation";
import {
  CONSULTATION_STATUSES,
  CONSULTATION_STATUS_LABELS,
  type ConsultationStatus,
  type ModelConsultationRequest,
} from "@/domain/consultation/types";
import { pricingStateLabel } from "@/domain/external-models/pricing-state";
import { formatMoney } from "@/lib/money";

function buildWhatsAppMessage(request: ModelConsultationRequest, finalQuoteMinor: number | null) {
  const quote =
    finalQuoteMinor != null
      ? formatMoney(finalQuoteMinor)
      : request.finalQuoteGrossMinor != null
        ? formatMoney(request.finalQuoteGrossMinor)
        : "—";
  return [
    `Merhaba ${request.customerName},`,
    "",
    `"${request.modelTitle}" modeli için üretim uygunluk talebiniz incelendi.`,
    `Malzeme: ${request.material} · Renk: ${request.color} · Ölçü: ${request.sizeLabel} · Adet: ${request.quantity}`,
    `Nihai teklif (KDV dahil): ${quote}`,
    "",
    "Devam etmek isterseniz bu mesaja yanıt verebilirsiniz.",
    "Baskı Çiftliği",
  ].join("\n");
}

export function ModelConsultationDetailPanel({
  initial,
}: {
  initial: ModelConsultationRequest;
}) {
  const router = useRouter();
  const [request, setRequest] = useState(initial);
  const [status, setStatus] = useState<ConsultationStatus>(initial.status);
  const [adminNote, setAdminNote] = useState(initial.adminNote ?? "");
  const [finalQuote, setFinalQuote] = useState(
    initial.finalQuoteGrossMinor != null ? String(initial.finalQuoteGrossMinor / 100) : "",
  );
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const finalQuoteGrossMinor =
      finalQuote.trim() === "" ? null : Math.round(Number(finalQuote.replace(",", ".")) * 100);
    if (finalQuote.trim() !== "" && (!Number.isFinite(finalQuoteGrossMinor!) || finalQuoteGrossMinor! < 0)) {
      setError("Geçerli bir teklif fiyatı girin.");
      setSaving(false);
      return;
    }
    try {
      const response = await fetch("/api/admin/consultation-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          id: request.id,
          status,
          adminNote: adminNote.trim() || null,
          finalQuoteGrossMinor,
        }),
      });
      const payload = (await response.json()) as {
        request?: ModelConsultationRequest;
        error?: string;
      };
      if (!response.ok || !payload.request) {
        setError(payload.error ?? "Kaydedilemedi.");
        return;
      }
      setRequest(payload.request);
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSaving(false);
    }
  }

  async function copyWhatsApp() {
    const finalQuoteMinor =
      finalQuote.trim() === "" ? null : Math.round(Number(finalQuote.replace(",", ".")) * 100);
    const text = buildWhatsAppMessage(request, finalQuoteMinor);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <AdminPageHeader
        eyebrow="Operasyon"
        title="Danışma talebi"
        description={request.modelTitle}
        actions={
          <Link
            href="/admin/model-danisma"
            className="inline-flex min-h-10 items-center rounded-full border border-white/15 px-4 text-sm font-semibold"
          >
            ← Listeye dön
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.85fr)]">
        <section className="space-y-6 rounded-2xl border border-white/10 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative size-32 shrink-0 overflow-hidden rounded-xl bg-black/30">
              {request.thumbnailUrl ? (
                <SafeImage
                  src={request.thumbnailUrl}
                  alt=""
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-xs text-muted-foreground">
                  Görsel yok
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-xl font-semibold">{request.modelTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {request.creatorName ?? "Tasarımcı bilinmiyor"}
              </p>
              <a
                href={request.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4"
              >
                Kaynak model
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
              <p className="mt-3 text-sm">
                <span className="text-muted-foreground">Lisans: </span>
                {request.licenseLabel ?? "Bilinmiyor"}
              </p>
              <p className="mt-2 text-sm">
                <span className="text-muted-foreground">Lisans değerlendirmesi: </span>
                {licenseEvaluationLabel(request.licenseEvaluation)}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {licenseEvaluationGuidance(
                  request.licenseEvaluation,
                  request.licenseCode,
                )}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
            <h3 className="font-semibold">Müşteri</h3>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Ad soyad</dt>
                <dd>{request.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Telefon</dt>
                <dd>{request.customerPhone}</dd>
              </div>
              {request.customerEmail ? (
                <div>
                  <dt className="text-xs text-muted-foreground">E-posta</dt>
                  <dd>{request.customerEmail}</dd>
                </div>
              ) : null}
            </dl>
            {request.customerNote ? (
              <p className="mt-3 text-muted-foreground">{request.customerNote}</p>
            ) : null}
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm">
            <h3 className="font-semibold">Üretim seçenekleri</h3>
            <dl className="mt-3 grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Malzeme</dt>
                <dd>{request.material}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Renk</dt>
                <dd>{request.color}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Ölçü</dt>
                <dd>{request.sizeLabel}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Müşteri fiyat durumu</dt>
                <dd>{pricingStateLabel(request.pricingState)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">İç tahmin (preset)</dt>
                <dd>
                  {request.estimatedGrossMinor != null
                    ? formatMoney(request.estimatedGrossMinor)
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Adet</dt>
                <dd>{request.quantity}</dd>
              </div>
            </dl>
          </div>
        </section>

        <aside className="space-y-4 rounded-2xl border border-white/10 p-5 sm:p-6">
          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Durum</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as ConsultationStatus)}
              className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3"
            >
              {CONSULTATION_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {CONSULTATION_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Admin notu</span>
            <textarea
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-semibold">Nihai teklif (₺)</span>
            <input
              inputMode="decimal"
              value={finalQuote}
              onChange={(event) => setFinalQuote(event.target.value)}
              placeholder="Örn. 450"
              className="min-h-11 w-full rounded-lg border border-white/15 bg-black/30 px-3"
            />
          </label>

          {error ? <p className="text-sm text-error">{error}</p> : null}

          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-cyan text-sm font-semibold text-ink disabled:opacity-50"
          >
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>

          <button
            type="button"
            onClick={() => void copyWhatsApp()}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/15 text-sm font-semibold"
          >
            <Copy className="size-4" aria-hidden="true" />
            {copied ? "Kopyalandı" : "WhatsApp mesajını kopyala"}
          </button>

          {status === "production_ok" ? (
            <p className="text-xs leading-5 text-muted-foreground">
              Ödeme bağlantısı ayrıca oluşturulduğunda müşteriye iletilebilir. Bu turda
              danışma talebinden doğrudan ödeme alınmaz.
            </p>
          ) : null}
        </aside>
      </div>
    </>
  );
}
