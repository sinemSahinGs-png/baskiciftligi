import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getOwnerPasswordViewer } from "@/lib/auth/admin-session";
import { getStaffSessionViewer } from "@/lib/auth/staff-session";

export const metadata: Metadata = {
  title: "Yönetici girişi",
  robots: { index: false, follow: false },
};

function safeNextPath(value: string | string[] | undefined): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (
    !candidate?.startsWith("/admin") ||
    candidate.startsWith("/admin/giris") ||
    candidate.startsWith("//")
  ) {
    return undefined;
  }
  return candidate;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  if (await getStaffSessionViewer()) {
    redirect("/admin/lil-disc");
  }
  if (await getOwnerPasswordViewer()) {
    redirect("/admin");
  }

  const query = await searchParams;

  return (
    <div className="grid min-h-screen place-items-center px-4 py-16">
      <AdminLoginForm nextPath={safeNextPath(query.next)} />
    </div>
  );
}
