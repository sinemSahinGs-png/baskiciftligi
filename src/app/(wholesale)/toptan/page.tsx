import { WholesaleCheckout } from "@/components/wholesale/checkout/wholesale-checkout";
import { createPageMetadata } from "@/components/content/metadata";
import { getViewer } from "@/lib/auth/session";
import {
  getPaytrCredentials,
  isPaytrTestMode,
  isWholesalePaytrStubEnabled,
} from "@/lib/wholesale/credentials";
import { getWholesalePhotoStates } from "@/lib/wholesale/photos-server";
import { buildWholesaleReadiness } from "@/lib/wholesale/readiness";
import { getWholesaleStore } from "@/lib/wholesale/repository";
import { siteConfig } from "@/config/site";

export const metadata = createPageMetadata({
  title: "Toptan çakmak paketi",
  description:
    "Karışık model kaplamalı çakmak toptan paketi. 50 veya 100 adet seç, bilgilerini gir, güvenli öde.",
  path: "/toptan",
});

export const dynamic = "force-dynamic";

export default async function WholesaleCheckoutPage() {
  const photos = getWholesalePhotoStates();
  let viewer = null;
  try {
    viewer = await getViewer();
  } catch {
    viewer = null;
  }

  const signedIn = Boolean(viewer && !viewer.isDemo);
  const isAdmin = Boolean(
    viewer && (viewer.role === "admin" || viewer.role === "owner" || viewer.isDemo),
  );

  let checkoutOpen = false;
  let shippingConfigured = false;
  let shippingGrossMinor: number | null = null;
  let adminNote: string | null = null;

  try {
    const store = await getWholesaleStore();
    const settings = await store.getSettings();
    const stub = isWholesalePaytrStubEnabled();
    const readiness = buildWholesaleReadiness({
      settings,
      paytrCredentials: Boolean(getPaytrCredentials()) || stub,
      paytrTestMode: isPaytrTestMode() || stub,
      schemaAvailable: true,
    });
    checkoutOpen = readiness.checkoutOpen;
    shippingConfigured = readiness.shippingConfigured;
    shippingGrossMinor = settings.shippingGrossMinor;
    adminNote =
      isAdmin && !readiness.checkoutOpen
        ? "Yönetici: Vitrin kapalı. Kargo, firma bilgileri, ödeme bilgileri ve sözleşme maddeleri /admin/toptan-siparisler kontrol listesinde tamamlanmalıdır."
        : null;
  } catch {
    checkoutOpen = false;
    shippingConfigured = false;
    shippingGrossMinor = null;
    adminNote = null;
  }

  return (
    <WholesaleCheckout
      checkoutOpen={checkoutOpen}
      shippingConfigured={shippingConfigured}
      shippingGrossMinor={shippingGrossMinor}
      adminNote={adminNote}
      photos={photos}
      signedIn={signedIn}
      supportEmail={siteConfig.contact.email}
    />
  );
}
