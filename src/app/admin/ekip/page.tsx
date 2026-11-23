import type { Metadata } from "next";

import { StaffInviteForm } from "@/components/admin/staff-invite-form";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { requireAdmin } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Ekip",
};

export default async function AdminTeamPage() {
  const viewer = await requireAdmin();
  if (viewer.role !== "owner") {
    redirect("/admin");
  }
  return (
    <>
      <AdminPageHeader
        eyebrow="Yönetim"
        title="LIL’ DISC operatörü"
        description="Arkadaşın bu kullanıcı adı ve şifreyle /admin/giris üzerinden yalnızca LIL’ DISC albüm ve siparişlerini görür."
      />
      <StaffInviteForm />
    </>
  );
}
