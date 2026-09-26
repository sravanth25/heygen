import "server-only";
import type { Order } from "../db";
import { createDemoSession } from "./demo";
import { createStripeSession } from "./stripe";
import { getCheckoutMode } from "@/lib/readiness";

export type PaymentSession = { sessionId: string; redirectUrl: string };

/**
 * Hosted-checkout abstraction. Raw card details never touch this server:
 * the customer is redirected to the provider's hosted page (or, in demo
 * mode, to a clearly labelled simulator that takes no card details).
 */
export async function createPaymentSession(order: Order, token: string, origin: string): Promise<PaymentSession> {
  const mode = getCheckoutMode();
  if (mode === "demo") return createDemoSession(order, token);
  if (mode === "stripe-test" || mode === "live") return createStripeSession(order, token, origin);
  throw new Error("Checkout is disabled until launch requirements are met.");
}
