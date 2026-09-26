import "server-only";
import { randomUUID } from "node:crypto";
import type { DB, OutboxEmail, Order } from "./db";
import { formatUSD } from "@/lib/money";
import { siteUrl } from "@/config/site";

/**
 * Transactional email. The only provider today is the admin "outbox": the
 * message is recorded but NOT delivered. Swap `queue` for a real provider
 * call (and keep the outbox record as a log) before launch.
 */
function queue(db: DB, email: Omit<OutboxEmail, "id" | "createdAt" | "delivery">) {
  db.outbox.unshift({ ...email, id: randomUUID(), createdAt: new Date().toISOString(), delivery: "not_sent_no_provider" });
}

export function queueOrderConfirmation(db: DB, order: Order, token: string) {
  const lines = order.items.map((i) => `- ${i.title} (${i.flavor}) × ${i.quantity}`).join("\n");
  queue(db, {
    kind: "order_confirmation",
    orderId: order.id,
    to: order.contact.email,
    subject: `FORMORA order ${order.number} confirmed`,
    body: `Thanks for your order.\n\n${lines}\n\nTotal: ${formatUSD(order.totalCents)}\n\nCheck your order status: ${siteUrl}/orders/${token}\n\nWe'll email you again when your order ships.`,
  });
}

export function queueShipmentUpdate(db: DB, order: Order) {
  const f = order.fulfillment;
  queue(db, {
    kind: "shipment_update",
    orderId: order.id,
    to: order.contact.email,
    subject: `Your FORMORA order ${order.number} has shipped`,
    body: `Your order is on its way.\n\nCarrier: ${f.carrier}\nTracking number: ${f.trackingNumber}${
      f.trackingUrl ? `\nTrack it: ${f.trackingUrl}` : ""
    }`,
  });
}

export function queueOrderLink(db: DB, order: Order, token: string) {
  queue(db, {
    kind: "order_link",
    orderId: order.id,
    to: order.contact.email,
    subject: `Your FORMORA order ${order.number}`,
    body: `Here is your secure order-status link:\n${siteUrl}/orders/${token}\n\nIf you didn't request this, you can ignore this email.`,
  });
}
