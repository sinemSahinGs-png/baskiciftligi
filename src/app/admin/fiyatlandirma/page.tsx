import { ManufacturingAdmin } from "@/components/admin/manufacturing-admin";
import { requireAdmin } from "@/lib/auth/session";

export default async function PricingAdminPage() {
  await requireAdmin();
  return <ManufacturingAdmin title="Fiyatlandırma" mode="pricing" />;
}
