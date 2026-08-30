import type { Metadata } from "next";

import { ModelConsultationAdminList } from "@/components/admin/model-consultation-admin-list";
import { listConsultationRequests } from "@/domain/consultation/repository";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Model danışma talepleri",
};

export const dynamic = "force-dynamic";

export default async function ModelConsultationAdminPage() {
  await requireAdmin();
  const requests = await listConsultationRequests();
  return <ModelConsultationAdminList requests={requests} />;
}
