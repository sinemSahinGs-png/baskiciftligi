import { ManufacturingAdmin } from "@/components/admin/manufacturing-admin";
import { requireAdmin } from "@/lib/auth/session";

export default async function QuotesAdminPage() {
  await requireAdmin();
  return <ManufacturingAdmin title="Teklif işleri" mode="jobs" />;
}
