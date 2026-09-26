/**
 * Brand, business, and mode configuration.
 *
 * Anything set to `null` is unknown business information. It must be
 * supplied (and verified) before launch — see /admin/launch. Never replace a
 * `null` with an invented value just to fill the design.
 */

export const brand = {
  name: "FORMORA",
  tagline: "Build your everyday.",
  // Provisional: pending domain and trademark checks. Do not add ® or ™.
  nameClearance: {
    domainChecked: false,
    trademarkChecked: false,
  },
  description:
    "Creatine and hydration powders with understandable ingredients, for adults who train regularly.",
  locale: "en-US",
  currency: "USD",
  market: "United States",
} as const;

export type BusinessInfo = {
  legalName: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  mailingAddress: string | null;
  supportHours: string | null;
  /** Typical reply time for support messages, e.g. "within 1 business day". */
  responseTime: string | null;
};

export const business: BusinessInfo = {
  legalName: null,
  supportEmail: null,
  supportPhone: null,
  mailingAddress: null,
  supportHours: null,
  responseTime: null,
};

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Site mode.
 * - "preview": design preview. Demo prices, demo checkout, nothing indexed.
 * - "live": real commerce. Only takes effect when every launch blocker is
 *   resolved (see lib/readiness.ts); otherwise checkout stays disabled.
 */
export type SiteMode = "preview" | "live";

export function getSiteMode(): SiteMode {
  return process.env.FORMORA_MODE === "live" ? "live" : "preview";
}

export const nav = [
  { href: "/shop", label: "Shop" },
  { href: "/ingredients", label: "Ingredients" },
  { href: "/about", label: "Our Story" },
  { href: "/faq", label: "FAQ" },
] as const;

export const footerNav = [
  { href: "/contact", label: "Contact" },
  { href: "/track", label: "Track an order" },
  { href: "/shipping-returns", label: "Shipping & returns" },
  { href: "/privacy", label: "Privacy (draft)" },
  { href: "/terms", label: "Terms (draft)" },
] as const;

export const supplementDisclaimer =
  "These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure, or prevent any disease.";
