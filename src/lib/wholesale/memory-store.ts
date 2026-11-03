import type {
  WholesaleListFilters,
  WholesaleOrder,
  WholesaleSettings,
  WholesaleStatusEvent,
} from "@/lib/wholesale/types";

export interface WholesaleStore {
  getSettings(): Promise<WholesaleSettings>;
  setShipping(input: {
    shippingGrossMinor: number;
    actor: string;
  }): Promise<WholesaleSettings>;
  setCheckoutOpen(input: {
    checkoutOpen: boolean;
    actor: string;
  }): Promise<WholesaleSettings>;
  recordPaytrTestCallback(): Promise<WholesaleSettings>;
  createOrder(order: WholesaleOrder): Promise<WholesaleOrder>;
  getById(id: string): Promise<WholesaleOrder | null>;
  getByOrderNumber(orderNumber: string): Promise<WholesaleOrder | null>;
  getByMerchantOid(merchantOid: string): Promise<WholesaleOrder | null>;
  getByIdempotencyKey(key: string): Promise<WholesaleOrder | null>;
  listOrders(filters: WholesaleListFilters): Promise<{
    rows: WholesaleOrder[];
    total: number;
    newCount: number;
    paidRevenueMinor: number;
  }>;
  listByUserId(userId: string): Promise<WholesaleOrder[]>;
  listGuestOrdersByEmailHashMatch(email: string): Promise<WholesaleOrder[]>;
  saveOrder(order: WholesaleOrder): Promise<WholesaleOrder>;
  appendEvent(event: WholesaleStatusEvent): Promise<void>;
  listEvents(orderId: string): Promise<WholesaleStatusEvent[]>;
  attachUser(orderId: string, userId: string): Promise<WholesaleOrder | null>;
}

function matchesFilters(order: WholesaleOrder, filters: WholesaleListFilters) {
  if (filters.paymentState && order.paymentState !== filters.paymentState) {
    return false;
  }
  if (
    filters.fulfilmentState &&
    order.fulfilmentState !== filters.fulfilmentState
  ) {
    return false;
  }
  if (filters.packageSku && order.packageSku !== filters.packageSku) {
    return false;
  }
  if (filters.from && order.createdAt < filters.from) {
    return false;
  }
  if (filters.to && order.createdAt > filters.to) {
    return false;
  }
  const q = filters.query?.trim().toLocaleLowerCase("tr-TR");
  if (q) {
    const hay = [
      order.orderNumber,
      order.customer.fullName,
      order.customer.phone,
      order.customer.email,
    ]
      .join(" ")
      .toLocaleLowerCase("tr-TR");
    if (!hay.includes(q)) {
      return false;
    }
  }
  return true;
}

export function createMemoryWholesaleStore(
  seed?: Partial<WholesaleSettings>,
): WholesaleStore {
  const orders = new Map<string, WholesaleOrder>();
  const events: WholesaleStatusEvent[] = [];
  let settings: WholesaleSettings = {
    shippingGrossMinor: seed?.shippingGrossMinor ?? null,
    shippingUpdatedAt: seed?.shippingUpdatedAt ?? null,
    shippingUpdatedBy: seed?.shippingUpdatedBy ?? null,
    checkoutOpen: seed?.checkoutOpen ?? seed?.shippingGrossMinor != null,
    paytrTestCallbackAt: seed?.paytrTestCallbackAt ?? null,
  };

  return {
    async getSettings() {
      return { ...settings };
    },
    async setShipping(input) {
      settings = {
        ...settings,
        shippingGrossMinor: input.shippingGrossMinor,
        shippingUpdatedAt: new Date().toISOString(),
        shippingUpdatedBy: input.actor,
      };
      return { ...settings };
    },
    async setCheckoutOpen(input) {
      if (input.checkoutOpen && settings.shippingGrossMinor == null) {
        throw new Error("SHIPPING_REQUIRED");
      }
      settings = {
        ...settings,
        checkoutOpen: input.checkoutOpen,
        shippingUpdatedBy: input.actor,
      };
      return { ...settings };
    },
    async recordPaytrTestCallback() {
      settings = {
        ...settings,
        paytrTestCallbackAt:
          settings.paytrTestCallbackAt ?? new Date().toISOString(),
      };
      return { ...settings };
    },
    async createOrder(order) {
      if ([...orders.values()].some((row) => row.merchantOid === order.merchantOid)) {
        throw new Error("DUPLICATE_MERCHANT_OID");
      }
      if (
        [...orders.values()].some((row) => row.idempotencyKey === order.idempotencyKey)
      ) {
        throw new Error("DUPLICATE_IDEMPOTENCY");
      }
      orders.set(order.id, order);
      return order;
    },
    async getById(id) {
      return orders.get(id) ?? null;
    },
    async getByOrderNumber(orderNumber) {
      return (
        [...orders.values()].find((row) => row.orderNumber === orderNumber) ??
        null
      );
    },
    async getByMerchantOid(merchantOid) {
      return (
        [...orders.values()].find((row) => row.merchantOid === merchantOid) ??
        null
      );
    },
    async getByIdempotencyKey(key) {
      return (
        [...orders.values()].find((row) => row.idempotencyKey === key) ?? null
      );
    },
    async listOrders(filters) {
      const all = [...orders.values()].sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1,
      );
      const rows = all.filter((row) => matchesFilters(row, filters));
      return {
        rows,
        total: rows.length,
        newCount: all.filter(
          (row) => row.paymentState === "paid" && row.fulfilmentState === "new",
        ).length,
        paidRevenueMinor: all
          .filter((row) => row.paymentState === "paid")
          .reduce((sum, row) => sum + row.grandTotalMinor, 0),
      };
    },
    async listByUserId(userId) {
      return [...orders.values()]
        .filter((row) => row.userId === userId)
        .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    },
    async listGuestOrdersByEmailHashMatch(email) {
      const normalized = email.trim().toLowerCase();
      return [...orders.values()].filter(
        (row) => row.userId === null && row.guestEmail === normalized,
      );
    },
    async saveOrder(order) {
      orders.set(order.id, { ...order, updatedAt: new Date().toISOString() });
      return orders.get(order.id)!;
    },
    async appendEvent(event) {
      events.push(event);
    },
    async listEvents(orderId) {
      return events
        .filter((event) => event.orderId === orderId)
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    },
    async attachUser(orderId, userId) {
      const order = orders.get(orderId);
      if (!order || order.userId) {
        return order ?? null;
      }
      const next = {
        ...order,
        userId,
        updatedAt: new Date().toISOString(),
      };
      orders.set(orderId, next);
      return next;
    },
  };
}
