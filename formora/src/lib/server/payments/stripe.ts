import "server-only";
import type { Order } from "../db";

/**
 * Stripe Checkout (hosted) via the REST API — no card data reaches us.
 * Only used when PAYMENT_PROVIDER=stripe and a key is configured; test keys
 * work in preview mode, live keys only once every launch blocker is resolved.
 */
function form(params: Record<string, string | number>) {
  return new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
}

export async function createStripeSession(order: Order, token: string, origin: string) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");

  const params: Record<string, string | number> = {
    mode: "payment",
    client_reference_id: order.id,
    customer_email: order.contact.email,
    "metadata[order_id]": order.id,
    "payment_intent_data[metadata][order_id]": order.id,
    success_url: `${origin}/checkout/success?t=${encodeURIComponent(token)}`,
    cancel_url: `${origin}/checkout/failed?reason=cancelled&t=${encodeURIComponent(token)}`,
  };
  const lines = [
    ...order.items.map((i) => ({ name: `${i.title} — ${i.flavor}`, amount: i.unitPriceCents, qty: i.quantity })),
    { name: "Shipping", amount: order.shippingCents, qty: 1 },
    ...(order.taxCents > 0 ? [{ name: "Sales tax", amount: order.taxCents, qty: 1 }] : []),
  ];
  lines.forEach((l, n) => {
    params[`line_items[${n}][price_data][currency]`] = "usd";
    params[`line_items[${n}][price_data][product_data][name]`] = l.name;
    params[`line_items[${n}][price_data][unit_amount]`] = l.amount;
    params[`line_items[${n}][quantity]`] = l.qty;
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Idempotency-Key": `formora-${order.id}-${order.accessTokenHashes.length}`,
    },
    body: form(params),
  });
  const body = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
  if (!res.ok || !body.id || !body.url) throw new Error(body.error?.message ?? "Could not start payment");
  return { sessionId: body.id, redirectUrl: body.url };
}
