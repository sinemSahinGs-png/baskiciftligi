import { PaymentConfirming } from "@/components/wholesale/checkout/payment-confirming";
import { createPageMetadata } from "@/components/content/metadata";

export const metadata = createPageMetadata({
  title: "Ödeme tamamlanamadı",
  description: "Ödeme alınamadı. Formunuz duruyor; tekrar deneyebilirsiniz.",
  path: "/odeme/basarisiz",
  noIndex: true,
});

export const dynamic = "force-dynamic";

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; token?: string }>;
}) {
  const query = await searchParams;
  return (
    <PaymentConfirming
      orderNumber={query.order ?? ""}
      token={query.token ?? ""}
      tone="fail"
    />
  );
}
