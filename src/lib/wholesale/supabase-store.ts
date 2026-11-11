import "server-only";

import { assertServiceRoleClient } from "@/lib/supabase/admin";
import type { WholesaleStore } from "@/lib/wholesale/memory-store";
import type {
  WholesaleInvoice,
  WholesaleListFilters,
  WholesaleOrder,
  WholesaleSettings,
  WholesaleStatusEvent,
} from "@/lib/wholesale/types";

function mapSettings(row: Record<string, unknown>): WholesaleSettings {
  return {
    shippingGrossMinor:
      row.shipping_gross_minor == null ? null : Number(row.shipping_gross_minor),
    shippingUpdatedAt: (row.shipping_updated_at as string | null) ?? null,
    shippingUpdatedBy: (row.shipping_updated_by as string | null) ?? null,
    checkoutOpen: Boolean(row.checkout_open),
    paytrTestCallbackAt: (row.paytr_test_callback_at as string | null) ?? null,
  };
}

function mapOrder(row: Record<string, unknown>): WholesaleOrder {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    merchantOid: String(row.merchant_oid),
    idempotencyKey: String(row.idempotency_key),
    userId: (row.user_id as string | null) ?? null,
    guestEmail: String(row.guest_email),
    trackingTokenHash: String(row.tracking_token_hash),
    packageSku: row.package_sku as WholesaleOrder["packageSku"],
    unitQuantity: Number(row.unit_quantity),
    unitGrossMinor: Number(row.unit_gross_minor),
    productGrossMinor: Number(row.product_gross_minor),
    standGrossMinor: Number(row.stand_gross_minor),
    shippingGrossMinor: Number(row.shipping_gross_minor),
    grandTotalMinor: Number(row.grand_total_minor),
    currency: "TRY",
    paymentState: row.payment_state as WholesaleOrder["paymentState"],
    fulfilmentState: row.fulfilment_state as WholesaleOrder["fulfilmentState"],
    customer: row.customer_snapshot as WholesaleOrder["customer"],
    shippingAddress: row.shipping_snapshot as WholesaleOrder["shippingAddress"],
    invoice: row.invoice_snapshot as WholesaleInvoice,
    customerNote: (row.customer_note as string | null) ?? null,
    agreements: (row.agreements_snapshot as WholesaleOrder["agreements"]) ?? [],
    paytrPaymentType: (row.paytr_payment_type as string | null) ?? null,
    paytrPaidAmountMinor:
      row.paytr_paid_amount_minor == null
        ? null
        : Number(row.paytr_paid_amount_minor),
    paytrFailureCode: (row.paytr_failure_code as string | null) ?? null,
    paytrFailureMessage: (row.paytr_failure_message as string | null) ?? null,
    paytrTestMode: Boolean(row.paytr_test_mode),
    shipmentCarrier: (row.shipment_carrier as string | null) ?? null,
    shipmentTrackingNumber:
      (row.shipment_tracking_number as string | null) ?? null,
    shipmentTrackingUrl: (row.shipment_tracking_url as string | null) ?? null,
    emailStatus: (row.email_status as WholesaleOrder["emailStatus"]) ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    paidAt: (row.paid_at as string | null) ?? null,
  };
}

function orderRow(order: WholesaleOrder) {
  return {
    id: order.id,
    order_number: order.orderNumber,
    merchant_oid: order.merchantOid,
    idempotency_key: order.idempotencyKey,
    user_id: order.userId,
    guest_email: order.guestEmail,
    tracking_token_hash: order.trackingTokenHash,
    package_sku: order.packageSku,
    unit_quantity: order.unitQuantity,
    unit_gross_minor: order.unitGrossMinor,
    product_gross_minor: order.productGrossMinor,
    stand_gross_minor: order.standGrossMinor,
    shipping_gross_minor: order.shippingGrossMinor,
    grand_total_minor: order.grandTotalMinor,
    currency: order.currency,
    payment_state: order.paymentState,
    fulfilment_state: order.fulfilmentState,
    customer_snapshot: order.customer,
    shipping_snapshot: order.shippingAddress,
    invoice_snapshot: order.invoice,
    customer_note: order.customerNote,
    agreements_snapshot: order.agreements,
    paytr_payment_type: order.paytrPaymentType,
    paytr_paid_amount_minor: order.paytrPaidAmountMinor,
    paytr_failure_code: order.paytrFailureCode,
    paytr_failure_message: order.paytrFailureMessage,
    paytr_test_mode: order.paytrTestMode,
    shipment_carrier: order.shipmentCarrier,
    shipment_tracking_number: order.shipmentTrackingNumber,
    shipment_tracking_url: order.shipmentTrackingUrl,
    email_status: order.emailStatus,
    created_at: order.createdAt,
    updated_at: order.updatedAt,
    paid_at: order.paidAt,
  };
}

export function createSupabaseWholesaleStore(): WholesaleStore {
  const supabase = assertServiceRoleClient();

  return {
    async getSettings() {
      const { data, error } = await supabase
        .from("wholesale_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) {
        throw error;
      }
      if (!data) {
        return {
          shippingGrossMinor: null,
          shippingUpdatedAt: null,
          shippingUpdatedBy: null,
          checkoutOpen: false,
          paytrTestCallbackAt: null,
        };
      }
      return mapSettings(data);
    },
    async setShipping(input) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("wholesale_settings")
        .upsert({
          id: 1,
          shipping_gross_minor: input.shippingGrossMinor,
          shipping_updated_at: now,
          shipping_updated_by: input.actor,
        })
        .select("*")
        .single();
      if (error) {
        throw error;
      }
      return mapSettings(data);
    },
    async setCheckoutOpen(input) {
      const current = await this.getSettings();
      if (input.checkoutOpen && current.shippingGrossMinor == null) {
        throw new Error("SHIPPING_REQUIRED");
      }
      const { data, error } = await supabase
        .from("wholesale_settings")
        .upsert({
          id: 1,
          checkout_open: input.checkoutOpen,
          shipping_updated_by: input.actor,
        })
        .select("*")
        .single();
      if (error) {
        throw error;
      }
      return mapSettings(data);
    },
    async recordPaytrTestCallback() {
      const now = new Date().toISOString();
      const current = await this.getSettings();
      const { data, error } = await supabase
        .from("wholesale_settings")
        .upsert({
          id: 1,
          paytr_test_callback_at: current.paytrTestCallbackAt ?? now,
        })
        .select("*")
        .single();
      if (error) {
        throw error;
      }
      return mapSettings(data);
    },
    async createOrder(order) {
      const { error } = await supabase.from("wholesale_orders").insert(orderRow(order));
      if (error) {
        if (error.code === "23505" && error.message.includes("idempotency")) {
          throw new Error("DUPLICATE_IDEMPOTENCY");
        }
        if (error.code === "23505" && error.message.includes("merchant_oid")) {
          throw new Error("DUPLICATE_MERCHANT_OID");
        }
        throw error;
      }
      return order;
    },
    async getById(id) {
      const { data, error } = await supabase
        .from("wholesale_orders")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data ? mapOrder(data) : null;
    },
    async getByOrderNumber(orderNumber) {
      const { data, error } = await supabase
        .from("wholesale_orders")
        .select("*")
        .eq("order_number", orderNumber)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data ? mapOrder(data) : null;
    },
    async getByMerchantOid(merchantOid) {
      const { data, error } = await supabase
        .from("wholesale_orders")
        .select("*")
        .eq("merchant_oid", merchantOid)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data ? mapOrder(data) : null;
    },
    async getByIdempotencyKey(key) {
      const { data, error } = await supabase
        .from("wholesale_orders")
        .select("*")
        .eq("idempotency_key", key)
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data ? mapOrder(data) : null;
    },
    async listOrders(filters: WholesaleListFilters) {
      let query = supabase.from("wholesale_orders").select("*", { count: "exact" });
      if (filters.paymentState) {
        query = query.eq("payment_state", filters.paymentState);
      }
      if (filters.fulfilmentState) {
        query = query.eq("fulfilment_state", filters.fulfilmentState);
      }
      if (filters.packageSku) {
        query = query.eq("package_sku", filters.packageSku);
      }
      if (filters.from) {
        query = query.gte("created_at", filters.from);
      }
      if (filters.to) {
        query = query.lte("created_at", filters.to);
      }
      if (filters.query?.trim()) {
        const q = filters.query.trim().replace(/%/g, "");
        query = query.or(
          `order_number.ilike.%${q}%,guest_email.ilike.%${q}%,customer_snapshot->>fullName.ilike.%${q}%,customer_snapshot->>phone.ilike.%${q}%`,
        );
      }
      const { data, error, count } = await query.order("created_at", {
        ascending: false,
      });
      if (error) {
        throw error;
      }
      const rows = (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
      const { data: stats } = await supabase
        .from("wholesale_orders")
        .select("payment_state, fulfilment_state, grand_total_minor");
      const all = stats ?? [];
      return {
        rows,
        total: count ?? rows.length,
        newCount: all.filter(
          (row) =>
            row.payment_state === "paid" && row.fulfilment_state === "new",
        ).length,
        paidRevenueMinor: all
          .filter((row) => row.payment_state === "paid")
          .reduce((sum, row) => sum + Number(row.grand_total_minor), 0),
      };
    },
    async listByUserId(userId) {
      const { data, error } = await supabase
        .from("wholesale_orders")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        throw error;
      }
      return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
    },
    async listGuestOrdersByEmailHashMatch(email) {
      const { data, error } = await supabase
        .from("wholesale_orders")
        .select("*")
        .is("user_id", null)
        .eq("guest_email", email.trim().toLowerCase());
      if (error) {
        throw error;
      }
      return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
    },
    async saveOrder(order) {
      const { error } = await supabase
        .from("wholesale_orders")
        .update(orderRow({ ...order, updatedAt: new Date().toISOString() }))
        .eq("id", order.id);
      if (error) {
        throw error;
      }
      return { ...order, updatedAt: new Date().toISOString() };
    },
    async appendEvent(event) {
      const { error } = await supabase.from("wholesale_order_events").insert({
        id: event.id,
        order_id: event.orderId,
        previous_payment_state: event.previousPaymentState,
        new_payment_state: event.newPaymentState,
        previous_fulfilment_state: event.previousFulfilmentState,
        new_fulfilment_state: event.newFulfilmentState,
        actor: event.actor,
        note: event.note,
        created_at: event.createdAt,
      });
      if (error) {
        throw error;
      }
    },
    async listEvents(orderId) {
      const { data, error } = await supabase
        .from("wholesale_order_events")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });
      if (error) {
        throw error;
      }
      return (data ?? []).map(
        (row) =>
          ({
            id: String(row.id),
            orderId: String(row.order_id),
            previousPaymentState: row.previous_payment_state,
            newPaymentState: row.new_payment_state,
            previousFulfilmentState: row.previous_fulfilment_state,
            newFulfilmentState: row.new_fulfilment_state,
            actor: String(row.actor),
            note: row.note,
            createdAt: String(row.created_at),
          }) satisfies WholesaleStatusEvent,
      );
    },
    async attachUser(orderId, userId) {
      const { data, error } = await supabase
        .from("wholesale_orders")
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .is("user_id", null)
        .select("*")
        .maybeSingle();
      if (error) {
        throw error;
      }
      return data ? mapOrder(data as Record<string, unknown>) : null;
    },
  };
}

export type { WholesaleSettings };
