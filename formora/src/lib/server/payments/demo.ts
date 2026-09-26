import "server-only";
import { randomBytes } from "node:crypto";
import type { Order } from "../db";

export function demoWebhookSecret(): string {
  // A fixed fallback is acceptable ONLY because demo mode can never take real
  // payments. Set DEMO_WEBHOOK_SECRET anyway so the signature path is real.
  return process.env.DEMO_WEBHOOK_SECRET || "formora-demo-webhook-secret-not-for-production";
}

export async function createDemoSession(order: Order, token: string) {
  const sessionId = `demo_cs_${randomBytes(12).toString("hex")}`;
  return {
    sessionId,
    redirectUrl: `/checkout/demo-pay/${sessionId}?t=${encodeURIComponent(token)}`,
  };
}
