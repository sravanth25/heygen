"use client";

/**
 * Client analytics hooks. Events carry product IDs, quantities and values
 * only — never names, emails, addresses or order tokens.
 *
 * Provider is chosen by NEXT_PUBLIC_ANALYTICS_PROVIDER ("none" | "console").
 * Any provider other than "none" requires consent first (see ConsentBanner).
 * "Verified purchase" is tracked on the server from the payment webhook.
 */

export type AnalyticsEvent =
  | { name: "product_viewed"; productId: string; valueCents: number }
  | { name: "add_to_cart"; productId: string; quantity: number; valueCents: number }
  | { name: "begin_checkout"; items: { productId: string; quantity: number }[]; valueCents: number };

export const CONSENT_KEY = "formora-analytics-consent";

export function analyticsProvider(): "none" | "console" {
  return process.env.NEXT_PUBLIC_ANALYTICS_PROVIDER === "console" ? "console" : "none";
}

export function getConsent(): "granted" | "denied" | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function track(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  // Always dispatch a DOM event so tests / tag managers can observe hooks.
  window.dispatchEvent(new CustomEvent("formora:analytics", { detail: event }));
  if (analyticsProvider() === "none" || getConsent() !== "granted") return;
  if (analyticsProvider() === "console") console.info("[analytics]", event);
}
