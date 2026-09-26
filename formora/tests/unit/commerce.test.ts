import { beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { computeTotals } from "@/lib/pricing";
import { signPayload, verifySignatureHeader, hashPassword, verifyPassword } from "@/lib/server/crypto";
import {
  addTracking,
  attachPaymentSession,
  createPendingOrder,
  findOrderByToken,
  issueTrackingLink,
  markSubmittedToSupplier,
  priceItems,
  processPaymentEvent,
  recordRefund,
} from "@/lib/server/orders";
import { read } from "@/lib/server/db";
import type { CheckoutInput } from "@/lib/validation";
import { checkoutSchema } from "@/lib/validation";

const input = (over: Partial<CheckoutInput> = {}): CheckoutInput => ({
  idempotencyKey: randomUUID(),
  items: [
    { productId: "creatine-hydration-lemon", quantity: 2 },
    { productId: "hydration-peach-mango", quantity: 1 },
  ],
  contact: { email: "test@example.com", phone: "" },
  address: { firstName: "A", lastName: "B", line1: "1 Main St", line2: "", city: "Austin", state: "TX", zip: "73301" },
  ...over,
});

beforeEach(() => {
  process.env.DATA_DIR = mkdtempSync(path.join(tmpdir(), "formora-test-"));
  delete process.env.FORMORA_UNAVAILABLE_PRODUCTS;
});

async function paidOrder() {
  const { order, token } = await createPendingOrder(input(), "demo");
  await attachPaymentSession(order.id, `demo_cs_${order.id}`);
  const r = await processPaymentEvent({
    provider: "demo",
    eventId: `evt_${order.id}`,
    type: "succeeded",
    sessionId: `demo_cs_${order.id}`,
    amountCents: order.totalCents,
    currency: "usd",
    reference: "pi_1",
  });
  expect(r).toBe("processed");
  return { order, token };
}

describe("totals", () => {
  it("computes subtotal, flat shipping and demo tax from catalog prices", () => {
    const t = computeTotals([{ unitPriceCents: 3999, quantity: 2 }, { unitPriceCents: 2999, quantity: 1 }], { state: "TX" });
    expect(t.subtotalCents).toBe(10997);
    expect(t.shippingCents).toBe(599);
    expect(t.taxCents).toBe(770); // 7% demo rate
    expect(t.totalCents).toBe(10997 + 599 + 770);
  });
  it("charges no shipping for an empty cart and defers tax until a state is known", () => {
    expect(computeTotals([]).totalCents).toBe(0);
    expect(computeTotals([{ unitPriceCents: 1000, quantity: 1 }]).taxCalculated).toBe(false);
  });
  it("ignores browser prices: line items come from the catalog", () => {
    const items = priceItems([{ productId: "creatine-hydration-lemon", quantity: 1 }]);
    expect(items[0].unitPriceCents).toBe(3999);
  });
  it("merges duplicate lines and rejects unavailable products", () => {
    expect(priceItems([{ productId: "hydration-peach-mango", quantity: 1 }, { productId: "hydration-peach-mango", quantity: 2 }])[0].quantity).toBe(3);
    process.env.FORMORA_UNAVAILABLE_PRODUCTS = "hydration-peach-mango";
    expect(() => priceItems([{ productId: "hydration-peach-mango", quantity: 1 }])).toThrow(/unavailable/);
  });
});

describe("validation", () => {
  it("rejects non-US states, bad ZIPs and oversize quantities", () => {
    const bad = checkoutSchema.safeParse({ ...input(), address: { ...input().address, state: "ON", zip: "123" } });
    expect(bad.success).toBe(false);
    const qty = checkoutSchema.safeParse({ ...input(), items: [{ productId: "creatine-hydration-lemon", quantity: 11 }] });
    expect(qty.success).toBe(false);
  });
});

describe("webhook signatures", () => {
  it("accepts a valid signature and rejects tampering, wrong secrets and stale timestamps", () => {
    const body = JSON.stringify({ a: 1 });
    const header = signPayload(body, "s3cret");
    expect(verifySignatureHeader(header, body, "s3cret")).toBe(true);
    expect(verifySignatureHeader(header, body + " ", "s3cret")).toBe(false);
    expect(verifySignatureHeader(header, body, "other")).toBe(false);
    expect(verifySignatureHeader(signPayload(body, "s3cret", 1000), body, "s3cret")).toBe(false);
    expect(verifySignatureHeader(null, body, "s3cret")).toBe(false);
  });
});

describe("payment events", () => {
  it("marks paid only once, even when the webhook is delivered twice", async () => {
    const { order } = await paidOrder();
    const again = await processPaymentEvent({
      provider: "demo", eventId: `evt_${order.id}`, type: "succeeded", sessionId: `demo_cs_${order.id}`,
      amountCents: order.totalCents, currency: "usd", reference: "pi_1",
    });
    expect(again).toBe("duplicate_event");
    const other = await processPaymentEvent({
      provider: "demo", eventId: "evt_other", type: "succeeded", sessionId: `demo_cs_${order.id}`,
      amountCents: order.totalCents, currency: "usd", reference: "pi_1",
    });
    expect(other).toBe("already_paid");
    const db = await read((d) => d);
    expect(db.orders).toHaveLength(1);
    expect(db.outbox.filter((e) => e.kind === "order_confirmation")).toHaveLength(1);
  });

  it("refuses to mark paid when the amount doesn't match the server total", async () => {
    const { order } = await createPendingOrder(input(), "demo");
    await attachPaymentSession(order.id, "demo_cs_x");
    const r = await processPaymentEvent({
      provider: "demo", eventId: "evt_x", type: "succeeded", sessionId: "demo_cs_x", amountCents: 1, currency: "usd", reference: null,
    });
    expect(r).toBe("amount_mismatch");
    expect((await read((d) => d.orders[0])).payment.status).toBe("awaiting_payment");
  });

  it("re-submitting the same checkout returns the same order", async () => {
    const i = input();
    const a = await createPendingOrder(i, "demo");
    const b = await createPendingOrder(i, "demo");
    expect(b.order.id).toBe(a.order.id);
    expect(await read((d) => d.orders.length)).toBe(1);
  });
});

describe("fulfillment workflow", () => {
  it("blocks submission before payment and prevents duplicate submissions", async () => {
    const { order: unpaid } = await createPendingOrder(input(), "demo");
    await expect(markSubmittedToSupplier(unpaid.id, "SUP-1", "admin")).rejects.toThrow(/verified/);

    const { order } = await paidOrder();
    await markSubmittedToSupplier(order.id, "SUP-100", "admin");
    await expect(markSubmittedToSupplier(order.id, "SUP-101", "admin")).rejects.toThrow(/Already submitted/);

    const { order: second } = await paidOrder();
    await expect(markSubmittedToSupplier(second.id, "sup-100", "admin")).rejects.toThrow(/already recorded/);
  });

  it("requires submission before tracking, then queues a shipment email", async () => {
    const { order } = await paidOrder();
    await expect(addTracking(order.id, { carrier: "USPS", trackingNumber: "9400100000000000000000", trackingUrl: "" }, "admin")).rejects.toThrow();
    await markSubmittedToSupplier(order.id, "SUP-200", "admin");
    await addTracking(order.id, { carrier: "USPS", trackingNumber: "9400100000000000000000", trackingUrl: "" }, "admin");
    const db = await read((d) => d);
    expect(db.orders[0].fulfillment.status).toBe("shipped");
    expect(db.orders[0].fulfillment.trackingUrl).toContain("usps.com");
    expect(db.outbox.some((e) => e.kind === "shipment_update")).toBe(true);
    expect(db.orders[0].audit.map((a) => a.action)).toContain("Marked submitted to Supliful");
  });

  it("recording a refund leaves supplier fulfillment unchanged", async () => {
    const { order } = await paidOrder();
    await markSubmittedToSupplier(order.id, "SUP-300", "admin");
    await recordRefund(order.id, order.totalCents, "customer request", "admin");
    const o = await read((d) => d.orders[0]);
    expect(o.payment.status).toBe("refunded");
    expect(o.fulfillment.status).toBe("submitted_to_supplier");
  });
});

describe("order access", () => {
  it("finds orders only by a valid token, never by order number", async () => {
    const { order, token } = await createPendingOrder(input(), "demo");
    expect((await findOrderByToken(token))?.id).toBe(order.id);
    expect(await findOrderByToken(order.number)).toBeNull();
    expect(await findOrderByToken("x".repeat(43))).toBeNull();
    const db = await read((d) => d.orders[0]);
    expect(JSON.stringify(db)).not.toContain(token);
  });
  it("tracking lookup needs both order number and matching email", async () => {
    const { order } = await createPendingOrder(input(), "demo");
    expect(await issueTrackingLink(order.number, "someone@else.com")).toBeNull();
    const t = await issueTrackingLink(order.number.toLowerCase(), "TEST@example.com");
    expect(t).toBeTruthy();
    expect((await findOrderByToken(t!))?.id).toBe(order.id);
  });
});

describe("admin passwords", () => {
  it("verifies scrypt hashes", () => {
    const h = hashPassword("correct horse battery");
    expect(verifyPassword("correct horse battery", h)).toBe(true);
    expect(verifyPassword("wrong", h)).toBe(false);
  });
});
