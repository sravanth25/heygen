import { NextResponse, type NextRequest } from "next/server";
import { verifySignatureHeader } from "@/lib/server/crypto";
import { processPaymentEvent } from "@/lib/server/orders";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      payment_status?: string;
      amount_total?: number;
      currency?: string;
      payment_intent?: string | null;
    };
  };
};

/**
 * Stripe webhook. The signature is verified against the raw body before any
 * parsing. Orders are only marked paid here — never from the success page.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const raw = await req.text();
  if (!verifySignatureHeader(req.headers.get("stripe-signature"), raw, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(raw) as StripeEvent;
  const s = event.data.object;
  const base = {
    provider: "stripe" as const,
    eventId: event.id,
    sessionId: s.id,
    amountCents: s.amount_total ?? null,
    currency: s.currency ?? null,
    reference: s.payment_intent ?? null,
  };

  let result = "ignored";
  switch (event.type) {
    case "checkout.session.completed":
      // Delayed methods complete with payment_status "unpaid"; wait for the async event.
      if (s.payment_status === "paid") result = await processPaymentEvent({ ...base, type: "succeeded" });
      break;
    case "checkout.session.async_payment_succeeded":
      result = await processPaymentEvent({ ...base, type: "succeeded" });
      break;
    case "checkout.session.async_payment_failed":
      result = await processPaymentEvent({ ...base, type: "failed", failureReason: "Payment failed" });
      break;
    case "checkout.session.expired":
      result = await processPaymentEvent({ ...base, type: "failed", failureReason: "Checkout expired" });
      break;
  }
  return NextResponse.json({ received: true, result });
}
