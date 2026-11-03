import { PaymentConfirming } from "@/components/wholesale/checkout/payment-confirming";
import { createPageMetadata } from "@/components/content/metadata";

export const metadata = createPageMetadata({
  title: "Ödeme kontrol ediliyor",
  description: "Sipariş ödemesi onaylanana kadar beklenir.",
  path: "/odeme/basarili",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const query = await searchParams;
  return (
    <PaymentConfirming
      orderNumber={query.order ?? ""}
      token={query.token ?? ""}
      tone="success"
    />
  );
}
