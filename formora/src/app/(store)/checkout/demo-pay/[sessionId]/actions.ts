"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { findOrderByToken } from "@/lib/server/orders";
import { signPayload } from "@/lib/server/crypto";
import { demoWebhookSecret } from "@/lib/server/payments/demo";
import { getCheckoutMode } from "@/lib/readiness";
import { siteUrl } from "@/config/site";

/**
 * Simulates the payment provider: it sends a SIGNED webhook to our own
 * webhook endpoint, exactly as a real provider would. The order is only
 * marked paid by the webhook handler, never here.
 */
export async function simulatePayment(formData: FormData) {
  if (getCheckoutMode() !== "demo") throw new Error("Demo payments are disabled.");
  const token = String(formData.get("t") ?? "");
  const outcome = formData.get("outcome") === "fail" ? "fail" : "succeed";
  const order = await findOrderByToken(token);
  if (!order || order.payment.provider !== "demo") redirect("/checkout/failed?reason=not_found");

  const event = {
    id: `demo_evt_${randomBytes(12).toString("hex")}`,
    type: outcome === "succeed" ? "payment.succeeded" : "payment.failed",
    sessionId: order.payment.sessionId,
    amountCents: order.totalCents,
    currency: "usd",
    reference: `demo_pi_${randomBytes(8).toString("hex")}`,
    ...(outcome === "fail" ? { failureReason: "Simulated card decline" } : {}),
  };
  const body = JSON.stringify(event);
  // Post to our own configured URL — never to a host taken from the request.
  const res = await fetch(`${siteUrl}/api/webhooks/demo`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-formora-signature": signPayload(body, demoWebhookSecret()) },
    body,
    cache: "no-store",
  });
  if (!res.ok) redirect(`/checkout/failed?reason=webhook&t=${encodeURIComponent(token)}`);

  redirect(
    outcome === "succeed"
      ? `/checkout/success?t=${encodeURIComponent(token)}`
      : `/checkout/failed?reason=declined&t=${encodeURIComponent(token)}`,
  );
}
