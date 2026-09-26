import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { verifySignatureHeader } from "@/lib/server/crypto";
import { demoWebhookSecret } from "@/lib/server/payments/demo";
import { processPaymentEvent } from "@/lib/server/orders";
import { getCheckoutMode } from "@/lib/readiness";

const eventSchema = z.object({
  id: z.string().min(8),
  type: z.enum(["payment.succeeded", "payment.failed"]),
  sessionId: z.string().startsWith("demo_cs_"),
  amountCents: z.number().int(),
  currency: z.literal("usd"),
  reference: z.string(),
  failureReason: z.string().optional(),
});

/** Signed webhook for the demo payment simulator. Never active in live mode. */
export async function POST(req: NextRequest) {
  if (getCheckoutMode() !== "demo") return NextResponse.json({ error: "Not found" }, { status: 404 });

  const raw = await req.text();
  if (!verifySignatureHeader(req.headers.get("x-formora-signature"), raw, demoWebhookSecret())) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  const parsed = eventSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const e = parsed.data;
  const result = await processPaymentEvent({
    provider: "demo",
    eventId: e.id,
    type: e.type === "payment.succeeded" ? "succeeded" : "failed",
    sessionId: e.sessionId,
    amountCents: e.amountCents,
    currency: e.currency,
    reference: e.reference,
    failureReason: e.failureReason,
  });
  return NextResponse.json({ received: true, result });
}
