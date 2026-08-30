"use client";

import Link from "next/link";
import { useMemo } from "react";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { licenseEvaluationLabel } from "@/domain/consultation/license-evaluation";
import {
  CONSULTATION_STATUS_LABELS,
  type ConsultationStatus,
  type ModelConsultationRequest,
} from "@/domain/consultation/types";
import { pricingStateLabel } from "@/domain/external-models/pricing-state";
import { formatMoney } from "@/lib/money";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ModelConsultationAdminList({
  requests,
}: {
  requests: ModelConsultationRequest[];
}) {
  const rows = useMemo(
    () => [...requests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [requests],
  );

  return (
    <>
      <AdminPageHeader
        eyebrow="Operasyon"
        title="Model danışma talepleri"
        description="Topluluk modelleri için müşteri üretim talepleri."
      />

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Müşteri</th>
              <th className="px-4 py-3">Model</th>
              <th className="px-4 py-3">Lisans değerlendirmesi</th>
              <th className="px-4 py-3">Fiyat durumu</th>
              <th className="px-4 py-3">İç tahmin</th>
              <th className="px-4 py-3">Adet</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-muted-foreground">
                  Henüz üretim talebi yok.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b border-white/5">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {formatDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{row.customerName}</div>
                    <div className="text-xs text-muted-foreground">{row.customerPhone}</div>
                  </td>
                  <td className="max-w-[14rem] px-4 py-3">
                    <div className="truncate font-semibold">{row.modelTitle}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {row.creatorName ?? "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {licenseEvaluationLabel(row.licenseEvaluation)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {pricingStateLabel(row.pricingState)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.estimatedGrossMinor != null
                      ? formatMoney(row.estimatedGrossMinor)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{row.quantity}</td>
                  <td className="px-4 py-3">
                    {CONSULTATION_STATUS_LABELS[row.status as ConsultationStatus]}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/model-danisma/${row.id}`}
                      className="underline underline-offset-4"
                    >
                      İncele
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
