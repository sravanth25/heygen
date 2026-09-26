import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Address } from "@/lib/validation";

/**
 * Minimal file-backed store for the preview build.
 *
 * It keeps orders, processed webhook events, the email outbox, and contact
 * messages on the server (never in the browser). All writes go through
 * `transact`, which serialises mutations inside this process. For production
 * replace this module with a real database that provides transactions and
 * unique constraints on `payment.sessionId`, `webhookEvents.id`, and
 * `fulfillment.suplifulOrderId`.
 */

export type PaymentStatus = "awaiting_payment" | "paid" | "failed" | "refunded" | "partially_refunded";
export type FulfillmentStatus =
  | "not_ready" // payment not verified yet
  | "awaiting_submission"
  | "submitted_to_supplier"
  | "shipped"
  | "on_hold"
  | "cancelled";

export type AuditEntry = { at: string; actor: string; action: string; detail?: string };

export type OrderItem = {
  productId: string;
  sku: string;
  title: string;
  flavor: string;
  unitPriceCents: number;
  quantity: number;
  supplierProductName: string;
  supplierVariant: string;
};

export type Order = {
  id: string;
  number: string;
  createdAt: string;
  updatedAt: string;
  synthetic: boolean;
  idempotencyKey: string;
  /** sha256 of customer access tokens. Raw tokens are never stored. */
  accessTokenHashes: string[];
  contact: { email: string; phone: string };
  address: Address;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  demoPricing: boolean;
  payment: {
    provider: "demo" | "stripe";
    status: PaymentStatus;
    sessionId: string;
    /** Earlier sessions for the same order (e.g. customer retried payment). */
    previousSessionIds?: string[];
    reference: string | null;
    paidAt: string | null;
    failureReason: string | null;
    refundedCents: number;
  };
  fulfillment: {
    status: FulfillmentStatus;
    suplifulOrderId: string | null;
    submittedAt: string | null;
    submittedBy: string | null;
    carrier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    shippedAt: string | null;
  };
  notes: { at: string; by: string; text: string }[];
  audit: AuditEntry[];
};

export type OutboxEmail = {
  id: string;
  createdAt: string;
  to: string;
  subject: string;
  body: string;
  kind: "order_confirmation" | "shipment_update" | "order_link";
  orderId: string;
  delivery: "not_sent_no_provider";
};

export type ContactMessage = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  orderNumber: string;
  message: string;
};

export type DB = {
  version: 1;
  orders: Order[];
  webhookEvents: { id: string; provider: string; receivedAt: string; result: string }[];
  outbox: OutboxEmail[];
  messages: ContactMessage[];
  seeded: boolean;
};

const EMPTY: DB = { version: 1, orders: [], webhookEvents: [], outbox: [], messages: [], seeded: false };

function dbFile() {
  const dir = process.env.DATA_DIR || path.join(process.cwd(), ".data");
  return path.join(dir, "formora-db.json");
}

async function readDB(): Promise<DB> {
  try {
    const raw = await fs.readFile(dbFile(), "utf8");
    return { ...EMPTY, ...(JSON.parse(raw) as DB) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(EMPTY);
    throw err;
  }
}

async function writeDB(db: DB) {
  const file = dbFile();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), { mode: 0o600 });
  await fs.rename(tmp, file);
}

const g = globalThis as unknown as { __formoraLock?: Promise<unknown> };

/** Run `fn` with exclusive access to the store; persists if it returns normally. */
export async function transact<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const prev = g.__formoraLock ?? Promise.resolve();
  let release!: () => void;
  const next = new Promise<void>((r) => (release = r));
  g.__formoraLock = prev.then(() => next);
  await prev.catch(() => undefined);
  try {
    const db = await readDB();
    const result = await fn(db);
    await writeDB(db);
    return result;
  } finally {
    release();
  }
}

export async function read<T>(fn: (db: DB) => T): Promise<T> {
  const prev = g.__formoraLock ?? Promise.resolve();
  await prev.catch(() => undefined);
  return fn(await readDB());
}
