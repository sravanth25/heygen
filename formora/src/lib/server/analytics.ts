import "server-only";

/**
 * Server-side analytics hook for events that must only fire after
 * verification (e.g. a purchase confirmed by a signed payment webhook).
 * Never include customer contact details or addresses.
 */
export function trackServer(event: "purchase_verified", props: { orderId: string; valueCents: number; items: { productId: string; quantity: number }[] }) {
  if (process.env.ANALYTICS_SERVER_LOG === "1") {
    console.info(`[analytics] ${event}`, JSON.stringify(props));
  }
}
