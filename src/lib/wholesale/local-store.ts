import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createMemoryWholesaleStore,
  type WholesaleStore,
} from "@/lib/wholesale/memory-store";
import type {
  WholesaleOrder,
  WholesaleSettings,
  WholesaleStatusEvent,
} from "@/lib/wholesale/types";

interface PersistedWholesale {
  settings: WholesaleSettings;
  orders: WholesaleOrder[];
  events: WholesaleStatusEvent[];
}

function emptySettings(): WholesaleSettings {
  return {
    shippingGrossMinor: null,
    shippingUpdatedAt: null,
    shippingUpdatedBy: null,
    checkoutOpen: false,
    paytrTestCallbackAt: null,
  };
}

function storeFile() {
  return path.join(process.cwd(), ".octo-data", "wholesale-orders.json");
}

async function readPersisted(): Promise<PersistedWholesale> {
  try {
    const raw = await readFile(
      /* turbopackIgnore: true */ storeFile(),
      "utf8",
    );
    const parsed = JSON.parse(raw) as PersistedWholesale;
    return {
      settings: {
        ...emptySettings(),
        ...parsed.settings,
      },
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return {
      settings: emptySettings(),
      orders: [],
      events: [],
    };
  }
}

async function writePersisted(data: PersistedWholesale) {
  const file = storeFile();
  await mkdir(/* turbopackIgnore: true */ path.dirname(file), { recursive: true });
  await writeFile(
    /* turbopackIgnore: true */ file,
    JSON.stringify(data, null, 2),
    "utf8",
  );
}

async function hydrate() {
  const data = await readPersisted();
  const memory = createMemoryWholesaleStore(data.settings);
  for (const order of data.orders) {
    await memory.createOrder(order);
  }
  const events: WholesaleStatusEvent[] = [];
  for (const event of data.events) {
    await memory.appendEvent(event);
    events.push(event);
  }
  return { memory, events };
}

async function persist(memory: WholesaleStore, events: WholesaleStatusEvent[]) {
  const listed = await memory.listOrders({});
  await writePersisted({
    settings: await memory.getSettings(),
    orders: listed.rows,
    events,
  });
}

function createDiskWholesaleStore(): WholesaleStore {
  return {
    async getSettings() {
      return (await readPersisted()).settings;
    },
    async setShipping(input) {
      const { memory, events } = await hydrate();
      const settings = await memory.setShipping(input);
      await persist(memory, events);
      return settings;
    },
    async setCheckoutOpen(input) {
      const { memory, events } = await hydrate();
      const settings = await memory.setCheckoutOpen(input);
      await persist(memory, events);
      return settings;
    },
    async recordPaytrTestCallback() {
      const { memory, events } = await hydrate();
      const settings = await memory.recordPaytrTestCallback();
      await persist(memory, events);
      return settings;
    },
    async createOrder(order) {
      const { memory, events } = await hydrate();
      const created = await memory.createOrder(order);
      await persist(memory, events);
      return created;
    },
    async getById(id) {
      return (await hydrate()).memory.getById(id);
    },
    async getByOrderNumber(orderNumber) {
      return (await hydrate()).memory.getByOrderNumber(orderNumber);
    },
    async getByMerchantOid(merchantOid) {
      return (await hydrate()).memory.getByMerchantOid(merchantOid);
    },
    async getByIdempotencyKey(key) {
      return (await hydrate()).memory.getByIdempotencyKey(key);
    },
    async listOrders(filters) {
      return (await hydrate()).memory.listOrders(filters);
    },
    async listByUserId(userId) {
      return (await hydrate()).memory.listByUserId(userId);
    },
    async listGuestOrdersByEmailHashMatch(email) {
      return (await hydrate()).memory.listGuestOrdersByEmailHashMatch(email);
    },
    async saveOrder(order) {
      const { memory, events } = await hydrate();
      const saved = await memory.saveOrder(order);
      await persist(memory, events);
      return saved;
    },
    async appendEvent(event) {
      const { memory, events } = await hydrate();
      await memory.appendEvent(event);
      events.push(event);
      await persist(memory, events);
    },
    async listEvents(orderId) {
      return (await hydrate()).memory.listEvents(orderId);
    },
    async attachUser(orderId, userId) {
      const { memory, events } = await hydrate();
      const attached = await memory.attachUser(orderId, userId);
      await persist(memory, events);
      return attached;
    },
  };
}

export function resetLocalWholesaleStoreCache() {
  // Disk-backed; nothing to reset besides the file itself.
}

export async function getLocalWholesaleStore(): Promise<WholesaleStore> {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Yerel toptan sipariş deposu üretimde kullanılamaz. Supabase şeması gerekir.",
    );
  }
  return createDiskWholesaleStore();
}
