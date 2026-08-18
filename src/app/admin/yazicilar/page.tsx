import { ManufacturingAdmin } from "@/components/admin/manufacturing-admin";
import { requireAdmin } from "@/lib/auth/session";

export default async function PrintersAdminPage() {
  await requireAdmin();
  return <ManufacturingAdmin title="Yazıcı profilleri" mode="printers" />;
}
