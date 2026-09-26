import { brand, business, getSiteMode } from "@/config/site";
import { getProducts, isProductFullyVerified } from "@/config/products";
import { shipping, tax, returns } from "@/config/shipping";
import { getEmailProvider, getPaymentProvider, policies } from "@/config/commerce";

export type ChecklistItem = {
  area: "Products" | "Prices" | "Assets" | "Payments" | "Business" | "Policies" | "Shipping" | "Brand" | "Email";
  label: string;
  done: boolean;
  /** Blocks live checkout when not done. */
  blocker: boolean;
};

export function getLaunchChecklist(): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  const env = process.env;

  for (const p of getProducts()) {
    items.push({
      area: "Products",
      label: `${p.title}: every fact verified against the physical label`,
      done: isProductFullyVerified(p),
      blocker: true,
    });
    items.push({
      area: "Prices",
      label: `${p.title}: launch price confirmed (currently $${(p.price.amountCents / 100).toFixed(2)} sample)`,
      done: p.price.confirmed,
      blocker: true,
    });
    items.push({
      area: "Assets",
      label: `${p.title}: authorized product photography replaces preview renders`,
      done: p.assets.every((a) => a.kind === "photo"),
      blocker: false,
    });
  }

  const stripeKey = env.STRIPE_SECRET_KEY ?? "";
  items.push(
    {
      area: "Payments",
      label: "Payment provider chosen, merchant account approved for supplements",
      done: getPaymentProvider() === "stripe" && stripeKey.startsWith("sk_live_"),
      blocker: true,
    },
    {
      area: "Payments",
      label: "Payment webhook secret configured and endpoint registered",
      done: Boolean(env.STRIPE_WEBHOOK_SECRET),
      blocker: true,
    },
    {
      area: "Payments",
      label: "Sales tax calculated by a real tax service (not the demo rate)",
      done: tax.mode === "provider",
      blocker: true,
    },
    { area: "Business", label: "Legal business name", done: Boolean(business.legalName), blocker: true },
    { area: "Business", label: "Support email address", done: Boolean(business.supportEmail), blocker: true },
    { area: "Business", label: "Business mailing address", done: Boolean(business.mailingAddress), blocker: true },
    { area: "Business", label: "Support hours and response time", done: Boolean(business.supportHours && business.responseTime), blocker: false },
    { area: "Policies", label: "Shipping & returns policy reviewed", done: !policies.shippingReturns.draft, blocker: true },
    { area: "Policies", label: "Privacy policy reviewed by counsel", done: !policies.privacy.draft, blocker: true },
    { area: "Policies", label: "Terms of sale reviewed by counsel", done: !policies.terms.draft, blocker: true },
    { area: "Policies", label: "Return window and damaged-order reporting period set", done: returns.verified && returns.windowDays !== null, blocker: true },
    {
      area: "Shipping",
      label: "Processing time, transit time, and rate confirmed with fulfillment partner",
      done: shipping.processing.verified && shipping.transit.verified && shipping.rateVerified,
      blocker: true,
    },
    { area: "Shipping", label: "Supported destinations confirmed", done: shipping.destinationsVerified, blocker: true },
    { area: "Brand", label: "Domain availability checked for FORMORA", done: brand.nameClearance.domainChecked, blocker: true },
    { area: "Brand", label: "Trademark clearance for FORMORA", done: brand.nameClearance.trademarkChecked, blocker: true },
    {
      area: "Email",
      label: "Transactional email provider connected (confirmation, shipment updates)",
      done: getEmailProvider() !== "outbox",
      blocker: true,
    },
    {
      area: "Payments",
      label: "Admin credentials and session secret set to strong unique values",
      done: Boolean(env.ADMIN_PASSWORD_HASH && env.ADMIN_SESSION_SECRET && env.ADMIN_SESSION_SECRET.length >= 32),
      blocker: true,
    },
  );
  return items;
}

export function getLaunchBlockers(): ChecklistItem[] {
  return getLaunchChecklist().filter((i) => i.blocker && !i.done);
}

export type CheckoutMode =
  /** Simulated payments only. */
  | "demo"
  /** Stripe test mode (sk_test_ key) in preview. */
  | "stripe-test"
  /** Real payments. Only when every blocker is resolved. */
  | "live"
  /** Live mode was requested but blockers remain. */
  | "disabled";

export function getCheckoutMode(): CheckoutMode {
  const mode = getSiteMode();
  const provider = getPaymentProvider();
  const key = process.env.STRIPE_SECRET_KEY ?? "";

  if (mode === "preview") {
    if (provider === "stripe" && key.startsWith("sk_test_")) return "stripe-test";
    return "demo";
  }
  if (getLaunchBlockers().length > 0) return "disabled";
  if (provider === "stripe" && key.startsWith("sk_live_")) return "live";
  return "disabled";
}

export function isPreview() {
  return getSiteMode() === "preview";
}
