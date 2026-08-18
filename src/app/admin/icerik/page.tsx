import type { Metadata } from "next";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { SiteContentEditor } from "@/components/admin/site-content-editor";
import { getSiteContent } from "@/domain/site/content-repository";

export const metadata: Metadata = {
  title: "İçerik yönetimi",
};

export default async function SiteContentPage() {
  const content = await getSiteContent();

  return (
    <>
      <AdminPageHeader
        eyebrow="Vitrin / İçerik"
        title="Yazılar ve kahraman bölümü"
        description="Ana sayfa başlığı, butonlar, kategori bölümü ve altbilgi metinlerini buradan değiştirin. Kategori fotoğrafları ve ölçek ayarı Kategoriler sayfasındadır."
      />
      <SiteContentEditor initial={content} />
    </>
  );
}
