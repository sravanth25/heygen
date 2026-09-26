import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import { transact, read, type Order, type DB, type FulfillmentStatus } from "./db";
import { newAccessToken, sha256 } from "./crypto";
import { queueOrderConfirmation, queueOrderLink, queueShipmentUpdate } from "./email";
import { trackServer } from "./analytics";
import { getProduct } from "@/config/products";
import { computeTotals } from "@/lib/pricing";
import type { CheckoutInput } from "@/lib/validation";

export class CommerceError extends Error {
  constructor(
    message: string,
    public code: "unavailable" | "unknown_product" | "not_found" | "invalid_state" | "duplicate" = "invalid_state",
  ) {
    super(message);
  }
}

const now = () => new Date().toISOString();

function orderNumber(): string {
  // Display reference only. Never used on its own to grant access.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let s = "";
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `FM-${s.slice(0, 4)}-${s.slice(4)}`;
}

function audit(order: Order, actor: string, action: string, detail?: string) {
  order.audit.push({ at: now(), actor, action, detail });
  order.updatedAt = now();
}

/** Build line items from the server-side catalog. Browser prices are ignored. */
export function priceItems(items: CheckoutInput["items"]) {
  const merged = new Map<string, number>();
  for (const i of items) merged.set(i.productId, (merged.get(i.productId) ?? 0) + i.quantity);

  return [...merged].map(([productId, quantity]) => {
    const p = getProduct(productId);
    if (!p) throw new CommerceError("One of the items in your cart is no longer sold.", "unknown_product");
    if (!p.available) throw new CommerceError(`${p.title} is currently unavailable. Remove it to continue.`, "unavailable");
    if (quantity > 10) throw new CommerceError("You can order up to 10 of each item.", "invalid_state");
    return {
      productId: p.id,
      sku: p.sku,
      title: p.title,
      flavor: p.flavor,
      unitPriceCents: p.price.amountCents,
      quantity,
      supplierProductName: p.supplier.productName,
      supplierVariant: p.supplier.variant,
    };
  });
}

/**
 * Create an order awaiting payment. Re-submitting the same checkout
 * (same idempotency key) returns the existing order instead of a duplicate.
 */
export async function createPendingOrder(input: CheckoutInput, provider: "demo" | "stripe") {
  const items = priceItems(input.items);
  const totals = computeTotals(items, { state: input.address.state });
  const token = newAccessToken();

  return transact((db) => {
    const existing = db.orders.find((o) => o.idempotencyKey === input.idempotencyKey);
    if (existing) {
      if (existing.payment.status !== "awaiting_payment") {
        throw new CommerceError("This checkout was already completed. Please refresh the page.", "duplicate");
      }
      existing.accessTokenHashes.push(sha256(token));
      return { order: existing, token, reused: true };
    }

    const order: Order = {
      id: randomUUID(),
      number: orderNumber(),
      createdAt: now(),
      updatedAt: now(),
      synthetic: false,
      idempotencyKey: input.idempotencyKey,
      accessTokenHashes: [sha256(token)],
      contact: { email: input.contact.email, phone: input.contact.phone ?? "" },
      address: input.address,
      items,
      subtotalCents: totals.subtotalCents,
      shippingCents: totals.shippingCents,
      taxCents: totals.taxCents,
      totalCents: totals.totalCents,
      demoPricing: items.some((i) => !getProduct(i.productId)?.price.confirmed),
      payment: {
        provider,
        status: "awaiting_payment",
        sessionId: "",
        reference: null,
        paidAt: null,
        failureReason: null,
        refundedCents: 0,
      },
      fulfillment: {
        status: "not_ready",
        suplifulOrderId: null,
        submittedAt: null,
        submittedBy: null,
        carrier: null,
        trackingNumber: null,
        trackingUrl: null,
        shippedAt: null,
      },
      notes: [],
      audit: [],
    };
    audit(order, "system", "Order created", "Awaiting payment verification");
    db.orders.unshift(order);
    return { order, token, reused: false };
  });
}

export async function attachPaymentSession(orderId: string, sessionId: string) {
  return transact((db) => {
    const o = db.orders.find((x) => x.id === orderId);
    if (!o) throw new CommerceError("Order not found", "not_found");
    if (o.payment.sessionId) o.payment.previousSessionIds = [...(o.payment.previousSessionIds ?? []), o.payment.sessionId];
    o.payment.sessionId = sessionId;
    audit(o, "system", "Payment session created", sessionId);
  });
}

export type PaymentEvent = {
  provider: "demo" | "stripe";
  eventId: string;
  type: "succeeded" | "failed";
  sessionId: string;
  amountCents: number | null;
  currency: string | null;
  reference: string | null;
  failureReason?: string;
};

export type PaymentEventResult = "processed" | "duplicate_event" | "already_paid" | "order_not_found" | "amount_mismatch" | "ignored";

/**
 * Apply a VERIFIED payment event (signature already checked by the caller).
 * Idempotent on the event id and on the order state, so retried or
 * duplicated webhooks never create a second order or double-send email.
 */
export async function processPaymentEvent(evt: PaymentEvent): Promise<PaymentEventResult> {
  return transact((db): PaymentEventResult => {
    const key = `${evt.provider}:${evt.eventId}`;
    if (db.webhookEvents.some((e) => e.id === key)) return "duplicate_event";

    const record = (result: PaymentEventResult) => {
      db.webhookEvents.unshift({ id: key, provider: evt.provider, receivedAt: now(), result });
      db.webhookEvents = db.webhookEvents.slice(0, 5000);
      return result;
    };

    const order = db.orders.find(
      (o) =>
        o.payment.provider === evt.provider &&
        (o.payment.sessionId === evt.sessionId || o.payment.previousSessionIds?.includes(evt.sessionId)),
    );
    if (!order) return record("order_not_found");

    if (evt.type === "succeeded") {
      if (order.payment.status === "paid" || order.payment.status.includes("refunded")) return record("already_paid");
      if (evt.amountCents !== order.totalCents || (evt.currency ?? "usd").toLowerCase() !== "usd") {
        audit(order, "system", "Payment amount mismatch — not marked paid", `expected ${order.totalCents}, got ${evt.amountCents}`);
        return record("amount_mismatch");
      }
      order.payment.status = "paid";
      order.payment.paidAt = now();
      order.payment.reference = evt.reference;
      order.payment.failureReason = null;
      order.fulfillment.status = "awaiting_submission";
      audit(order, "system", "Payment verified by webhook", `${evt.provider} event ${evt.eventId}`);
      const token = newAccessToken();
      order.accessTokenHashes.push(sha256(token));
      queueOrderConfirmation(db, order, token);
      trackServer("purchase_verified", {
        orderId: order.id,
        valueCents: order.totalCents,
        items: order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      return record("processed");
    }

    if (order.payment.status !== "awaiting_payment") return record("ignored");
    order.payment.status = "failed";
    order.payment.failureReason = evt.failureReason ?? "Payment was not completed";
    audit(order, "system", "Payment failed", order.payment.failureReason);
    return record("processed");
  });
}

export async function findOrderByToken(token: string): Promise<Order | null> {
  if (!token || token.length < 32 || token.length > 64) return null;
  const hash = sha256(token);
  return read((db) => db.orders.find((o) => o.accessTokenHashes.includes(hash)) ?? null);
}

/**
 * Order lookup for the "Track an order" form. Requires BOTH the order number
 * and the email on the order. Issues a fresh access token and queues it by
 * email.
 */
export async function issueTrackingLink(numberInput: string, emailInput: string): Promise<string | null> {
  const number = numberInput.trim().toUpperCase();
  const email = emailInput.trim().toLowerCase();
  return transact((db) => {
    const order = db.orders.find((o) => o.number === number && o.contact.email === email && !o.synthetic);
    if (!order) return null;
    const token = newAccessToken();
    order.accessTokenHashes.push(sha256(token));
    order.accessTokenHashes = order.accessTokenHashes.slice(-10);
    queueOrderLink(db, order, token);
    audit(order, "customer", "Order-status link requested");
    return token;
  });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function listOrders() {
  return read((db) => db.orders);
}

export async function getOrderById(id: string) {
  return read((db) => db.orders.find((o) => o.id === id) ?? null);
}

function mutateOrder<T>(id: string, fn: (o: Order, db: DB) => T) {
  return transact((db) => {
    const o = db.orders.find((x) => x.id === id);
    if (!o) throw new CommerceError("Order not found", "not_found");
    return fn(o, db);
  });
}

export async function markSubmittedToSupplier(id: string, suplifulOrderId: string, actor: string) {
  const sid = suplifulOrderId.trim();
  if (!/^[A-Za-z0-9#_-]{3,40}$/.test(sid)) throw new CommerceError("Enter the Supliful order ID exactly as shown in Supliful.");
  return mutateOrder(id, (o, db) => {
    if (o.payment.status !== "paid") throw new CommerceError("Only orders with a verified, un-refunded payment can be submitted.");
    if (o.fulfillment.status !== "awaiting_submission") {
      throw new CommerceError(
        o.fulfillment.suplifulOrderId
          ? `Already submitted as Supliful order ${o.fulfillment.suplifulOrderId}. Nothing was changed.`
          : `Order is ${o.fulfillment.status.replaceAll("_", " ")}; it can't be submitted.`,
        "duplicate",
      );
    }
    const clash = db.orders.find((x) => x.id !== o.id && x.fulfillment.suplifulOrderId?.toLowerCase() === sid.toLowerCase());
    if (clash) throw new CommerceError(`Supliful order ${sid} is already recorded on order ${clash.number}.`, "duplicate");
    o.fulfillment.status = "submitted_to_supplier";
    o.fulfillment.suplifulOrderId = sid;
    o.fulfillment.submittedAt = now();
    o.fulfillment.submittedBy = actor;
    audit(o, actor, "Marked submitted to Supliful", `Supliful order ${sid}`);
  });
}

const TRACKING_URLS: Record<string, (n: string) => string> = {
  USPS: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}`,
  UPS: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}`,
  FedEx: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`,
  DHL: (n) => `https://www.dhl.com/us-en/home/tracking.html?tracking-id=${encodeURIComponent(n)}`,
};

export async function addTracking(id: string, input: { carrier: string; trackingNumber: string; trackingUrl: string }, actor: string) {
  const carrier = input.carrier.trim();
  const trackingNumber = input.trackingNumber.trim();
  let trackingUrl = input.trackingUrl.trim();
  if (!carrier) throw new CommerceError("Choose a carrier.");
  if (!/^[A-Za-z0-9 -]{6,40}$/.test(trackingNumber)) throw new CommerceError("Enter a valid tracking number.");
  if (trackingUrl) {
    try {
      const u = new URL(trackingUrl);
      if (u.protocol !== "https:") throw new Error();
    } catch {
      throw new CommerceError("Tracking link must be a full https:// URL.");
    }
  } else {
    trackingUrl = TRACKING_URLS[carrier]?.(trackingNumber) ?? "";
  }

  return mutateOrder(id, (o, db) => {
    if (o.fulfillment.status !== "submitted_to_supplier" && o.fulfillment.status !== "shipped") {
      throw new CommerceError("Add tracking only after the order has been submitted to Supliful.");
    }
    const wasShipped = o.fulfillment.status === "shipped";
    o.fulfillment.status = "shipped";
    o.fulfillment.carrier = carrier;
    o.fulfillment.trackingNumber = trackingNumber;
    o.fulfillment.trackingUrl = trackingUrl || null;
    o.fulfillment.shippedAt ??= now();
    audit(o, actor, wasShipped ? "Tracking updated" : "Tracking added — marked shipped", `${carrier} ${trackingNumber}`);
    queueShipmentUpdate(db, o);
  });
}

export async function addNote(id: string, text: string, actor: string) {
  const t = text.trim();
  if (!t) throw new CommerceError("Note is empty.");
  if (t.length > 2000) throw new CommerceError("Keep notes under 2,000 characters.");
  return mutateOrder(id, (o) => {
    o.notes.push({ at: now(), by: actor, text: t });
    audit(o, actor, "Note added");
  });
}

/**
 * Record a refund that was issued in the payment provider's dashboard.
 * This does NOT cancel supplier fulfillment — that is a separate action.
 */
export async function recordRefund(id: string, amountCents: number, reason: string, actor: string) {
  return mutateOrder(id, (o) => {
    if (o.payment.status !== "paid" && o.payment.status !== "partially_refunded") {
      throw new CommerceError("Only paid orders can have a refund recorded.");
    }
    const remaining = o.totalCents - o.payment.refundedCents;
    if (!Number.isInteger(amountCents) || amountCents <= 0 || amountCents > remaining) {
      throw new CommerceError(`Refund must be between $0.01 and $${(remaining / 100).toFixed(2)}.`);
    }
    o.payment.refundedCents += amountCents;
    o.payment.status = o.payment.refundedCents >= o.totalCents ? "refunded" : "partially_refunded";
    audit(o, actor, "Refund recorded", `$${(amountCents / 100).toFixed(2)} — ${reason || "no reason given"}`);
  });
}

export async function setFulfillmentHold(id: string, action: "hold" | "release" | "cancel", reason: string, actor: string) {
  return mutateOrder(id, (o) => {
    const from = o.fulfillment.status;
    let to: FulfillmentStatus;
    if (action === "hold") {
      if (from !== "awaiting_submission") throw new CommerceError("Only orders awaiting submission can be put on hold.");
      to = "on_hold";
    } else if (action === "release") {
      if (from !== "on_hold") throw new CommerceError("Order is not on hold.");
      to = "awaiting_submission";
    } else {
      if (from === "shipped" || from === "cancelled") throw new CommerceError(`Can't cancel fulfillment for an order that is ${from}.`);
      if (!reason.trim()) throw new CommerceError("Give a reason for cancelling fulfillment.");
      to = "cancelled";
    }
    o.fulfillment.status = to;
    audit(o, actor, `Fulfillment ${from.replaceAll("_", " ")} → ${to.replaceAll("_", " ")}`, reason || undefined);
  });
}

export type AttentionFlag = { level: "warn" | "info"; text: string };

export function attentionFlags(o: Order, at = Date.now()): AttentionFlag[] {
  const flags: AttentionFlag[] = [];
  const hours = (iso: string | null) => (iso ? (at - Date.parse(iso)) / 36e5 : 0);
  if (o.payment.status === "paid" && o.fulfillment.status === "awaiting_submission" && hours(o.payment.paidAt) > 24) {
    flags.push({ level: "warn", text: "Paid over 24h ago, not yet submitted" });
  }
  if (o.payment.status.includes("refunded") && ["awaiting_submission", "submitted_to_supplier", "on_hold"].includes(o.fulfillment.status)) {
    flags.push({ level: "warn", text: "Refunded — check supplier fulfillment" });
  }
  if (o.fulfillment.status === "submitted_to_supplier" && hours(o.fulfillment.submittedAt) > 24 * 5) {
    flags.push({ level: "warn", text: "Submitted 5+ days ago, no tracking" });
  }
  if (o.fulfillment.status === "on_hold") flags.push({ level: "info", text: "On hold" });
  if (o.payment.status === "awaiting_payment" && hours(o.createdAt) > 2) flags.push({ level: "info", text: "Abandoned payment" });
  return flags;
}
