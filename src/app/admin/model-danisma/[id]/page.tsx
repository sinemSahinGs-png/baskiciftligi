import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ModelConsultationDetailPanel } from "@/components/admin/model-consultation-detail-panel";
import { getConsultationRequest } from "@/domain/consultation/repository";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Danışma talebi",
};

export const dynamic = "force-dynamic";

export default async function ModelConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const request = await getConsultationRequest(id);
  if (!request) notFound();
  return <ModelConsultationDetailPanel initial={request} />;
}
