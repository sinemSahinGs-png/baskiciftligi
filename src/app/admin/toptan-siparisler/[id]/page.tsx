import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page";
import { WholesaleFulfilmentForm } from "@/components/wholesale/admin/fulfilment-form";
import { requireAdmin } from "@/lib/auth/session";
import { formatMoney } from "@/lib/money";
import {
  fulfilmentStateLabel,
  packageTitle,
  paymentStateLabel,
} from "@/lib/wholesale/labels";
import { getWholesaleStore } from "@/lib/wholesale/repository";

export const dynamic = "force-dynamic";

export default async function WholesaleOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const store = await getWholesaleStore();
  const order = await store.getById(id);
  if (!order) {
    notFound();
  }
  const events = await store.listEvents(id);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Toptan sipariş"
        title={order.orderNumber}
        description={`${packageTitle(order.packageSku)} · ${order.paytrTestMode ? "Test ödemesi" : "Canlı ödeme"}`}
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-2 rounded-xl border border-white/10 p-4 text-sm">
          <p>Ürün: {formatMoney(order.productGrossMinor)}</p>
          <p>Satış standı: Hediye</p>
          <p>Kargo: {formatMoney(order.shippingGrossMinor)}</p>
          <p className="font-semibold">Toplam: {formatMoney(order.grandTotalMinor)}</p>
          <p>Ödeme: {paymentStateLabel(order.paymentState)}</p>
          <p>
            Ödenen tutar:{" "}
            {order.paytrPaidAmountMinor == null
              ? "—"
              : formatMoney(order.paytrPaidAmountMinor)}
          </p>
          <p>Ödeme yöntemi: {order.paytrPaymentType ?? "—"}</p>
        </section>
        <section className="space-y-2 rounded-xl border border-white/10 p-4 text-sm">
          <p>{order.customer.fullName}</p>
          <p>{order.customer.phone}</p>
          <p>{order.customer.email}</p>
          <p>
            {order.shippingAddress.line}, {order.shippingAddress.district} /{" "}
            {order.shippingAddress.city}
          </p>
          <p>Fatura: {order.invoice.type === "kurumsal" ? "Kurumsal" : "Bireysel"}</p>
          {order.invoice.companyName ? <p>{order.invoice.companyName}</p> : null}
          {order.invoice.taxOffice ? (
            <p>
              {order.invoice.taxOffice} / {order.invoice.taxNumber}
            </p>
          ) : null}
          <p>Not: {order.customerNote ?? "—"}</p>
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-white/10 p-4">
        <h2 className="font-semibold">Sözleşme kayıtları</h2>
        <ul className="mt-2 space-y-1 text-xs">
          {order.agreements.map((item) => (
            <li key={item.versionId}>
              {item.title} · {item.acceptedAt}
            </li>
          ))}
        </ul>
      </section>

      <WholesaleFulfilmentForm order={order} />

      <section className="mt-6">
        <h2 className="font-semibold">Durum geçmişi</h2>
        <ol className="mt-2 space-y-2 text-xs">
          {events.map((event) => (
            <li key={event.id}>
              {event.createdAt} · {event.note ?? "Durum güncellendi"}
              {event.newPaymentState
                ? ` · ${paymentStateLabel(event.newPaymentState)}`
                : ""}
              {event.newFulfilmentState
                ? ` · ${fulfilmentStateLabel(event.newFulfilmentState)}`
                : ""}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
