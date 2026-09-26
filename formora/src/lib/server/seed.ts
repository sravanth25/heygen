import "server-only";
import { randomUUID } from "node:crypto";
import { transact, type Order } from "./db";
import { getProducts } from "@/config/products";
import { computeTotals } from "@/lib/pricing";
import { isPreview } from "@/lib/readiness";

/**
 * Seeds SYNTHETIC orders so the admin prototype has something to show.
 * Preview mode only; every record is flagged `synthetic` and uses
 * example.com addresses. Never runs in live mode.
 */
export async function ensureSeeded() {
  if (!isPreview() || process.env.SEED_SYNTHETIC_ORDERS !== "1") return;
  await transact((db) => {
    if (db.seeded) return;
    db.seeded = true;
    const [a, b] = getProducts();
    const hoursAgo = (h: number) => new Date(Date.now() - h * 36e5).toISOString();

    const make = (
      n: number,
      created: number,
      lines: [typeof a, number][],
      state: string,
      payment: Order["payment"]["status"],
      fulfillment: Order["fulfillment"]["status"],
      extra: Partial<Order["fulfillment"]> = {},
    ): Order => {
      const items = lines.map(([p, q]) => ({
        productId: p.id,
        sku: p.sku,
        title: p.title,
        flavor: p.flavor,
        unitPriceCents: p.price.amountCents,
        quantity: q,
        supplierProductName: p.supplier.productName,
        supplierVariant: p.supplier.variant,
      }));
      const t = computeTotals(items, { state });
      const paid = payment !== "awaiting_payment" && payment !== "failed";
      return {
        id: randomUUID(),
        number: `FM-DEMO-${String(n).padStart(4, "0")}`,
        createdAt: hoursAgo(created),
        updatedAt: hoursAgo(Math.max(0, created - 1)),
        synthetic: true,
        idempotencyKey: randomUUID(),
        accessTokenHashes: [],
        contact: { email: `synthetic.customer${n}@example.com`, phone: "" },
        address: {
          firstName: "Synthetic",
          lastName: `Customer ${n}`,
          line1: `${100 + n} Example Street`,
          line2: "",
          city: "Sampletown",
          state,
          zip: "00000",
        },
        items,
        subtotalCents: t.subtotalCents,
        shippingCents: t.shippingCents,
        taxCents: t.taxCents,
        totalCents: t.totalCents,
        demoPricing: true,
        payment: {
          provider: "demo",
          status: payment,
          sessionId: `demo_cs_seed_${n}`,
          reference: paid ? `demo_pi_seed_${n}` : null,
          paidAt: paid ? hoursAgo(created) : null,
          failureReason: payment === "failed" ? "Simulated card decline" : null,
          refundedCents: payment === "refunded" ? t.totalCents : 0,
        },
        fulfillment: {
          status: fulfillment,
          suplifulOrderId: null,
          submittedAt: null,
          submittedBy: null,
          carrier: null,
          trackingNumber: null,
          trackingUrl: null,
          shippedAt: null,
          ...extra,
        },
        notes: [],
        audit: [{ at: hoursAgo(created), actor: "seed", action: "Synthetic order created for the admin prototype" }],
      };
    };

    db.orders.push(
      make(1, 2, [[a, 1]], "CA", "paid", "awaiting_submission"),
      make(2, 30, [[b, 2]], "TX", "paid", "awaiting_submission"),
      make(3, 50, [[a, 2], [b, 1]], "NY", "paid", "submitted_to_supplier", {
        suplifulOrderId: "SEED-EXAMPLE-3",
        submittedAt: hoursAgo(48),
        submittedBy: "seed",
      }),
      make(4, 140, [[b, 1]], "WA", "paid", "shipped", {
        suplifulOrderId: "SEED-EXAMPLE-4",
        submittedAt: hoursAgo(130),
        submittedBy: "seed",
        carrier: "USPS",
        trackingNumber: "EXAMPLE0000000004",
        trackingUrl: null,
        shippedAt: hoursAgo(100),
      }),
      make(5, 70, [[a, 1]], "FL", "refunded", "awaiting_submission"),
      make(6, 5, [[a, 1]], "IL", "failed", "not_ready"),
    );
  });
}
