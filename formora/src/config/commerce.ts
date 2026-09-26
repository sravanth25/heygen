/**
 * Payment and email provider configuration. Server-only values are read from
 * the environment at call time; nothing here is sent to the browser except
 * through the explicit public helpers in lib/public-config.ts.
 */

export type PaymentProvider = "demo" | "stripe";

export function getPaymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "stripe" ? "stripe" : "demo";
}

export type EmailProvider = "outbox";

/**
 * Only "outbox" exists today: messages are stored for review in the admin
 * area and are NOT delivered. Connect a real provider before launch.
 */
export function getEmailProvider(): EmailProvider {
  return "outbox";
}

/**
 * Payment methods shown to customers. Leave empty until the provider account
 * is approved and the methods are actually enabled — we never display logos
 * for unsupported methods.
 */
export const displayedPaymentMethods: string[] = [];

export const policies = {
  shippingReturns: { draft: true },
  privacy: { draft: true },
  terms: { draft: true },
};

/** Documents such as certificates of analysis. Only list real files. */
export const testingDocuments: { productId: string; label: string; url: string; date: string }[] = [];
