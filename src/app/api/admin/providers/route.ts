import { NextResponse } from "next/server";

import { getAdminSessionViewer } from "@/lib/auth/session";
import { canViewAdminCatalog } from "@/lib/catalog/authorization";
import { listProviderStatusSnapshots } from "@/providers/registry";

export async function GET() {
  const viewer = await getAdminSessionViewer();
  if (!viewer || !canViewAdminCatalog(viewer.role)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }
  return NextResponse.json({
    providers: listProviderStatusSnapshots(),
  });
}
