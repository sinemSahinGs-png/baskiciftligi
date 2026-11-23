import type { Metadata } from "next";

import { LilDiscAlbumEditor } from "@/components/admin/lil-disc-album-editor";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { listLilDiscAlbumRecords } from "@/domain/lil-disc/repository";
import { requireLilDiscManager } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "LIL’ DISC albümler",
};

export const dynamic = "force-dynamic";

export default async function AdminLilDiscPage() {
  await requireLilDiscManager();
  const albums = await listLilDiscAlbumRecords();

  return (
    <>
      <AdminPageHeader
        eyebrow="LIL’ DISC"
        title="Albümler"
        description="Kapak, ad ve fiyatı buradan değiştirince vitrin ve sepet aynı anda güncellenir."
      />
      <LilDiscAlbumEditor albums={albums} />
    </>
  );
}
