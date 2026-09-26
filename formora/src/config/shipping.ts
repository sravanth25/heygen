/**
 * Shipping, tax, and returns configuration.
 *
 * Processing and transit are kept separate. All estimates below are
 * placeholders (`verified: false`) until confirmed with the fulfillment
 * partner — the UI labels them as such in preview mode.
 */

export const US_STATES: { code: string; name: string }[] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"],
  ["ME", "Maine"], ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"],
  ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"], ["SD", "South Dakota"],
  ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"],
  ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
].map(([code, name]) => ({ code, name }));

export const shipping = {
  /** State codes we deliver to. Confirm with the fulfillment partner. */
  supportedStates: US_STATES.map((s) => s.code),
  destinationLabel: "the 50 US states and Washington, DC",
  destinationsVerified: false,
  processing: { minBusinessDays: 1, maxBusinessDays: 3, verified: false },
  transit: { minBusinessDays: 3, maxBusinessDays: 7, verified: false },
  /** Flat rate per order. There is no free-shipping offer configured. */
  flatRateCents: 599,
  rateVerified: false,
  carriers: ["USPS", "UPS", "FedEx", "DHL", "Other"] as const,
  maxQuantityPerItem: 10,
};

export const tax = {
  /**
   * "demo-flat": an illustrative flat rate so totals are visible in preview.
   * Replace with a real sales-tax calculation (e.g. the payment provider's
   * tax product or a tax service) before launch.
   */
  mode: "demo-flat" as "demo-flat" | "provider",
  demoRate: 0.07,
  label: "Estimated sales tax (demo rate)",
};

export const returns = {
  /** Number of days customers have to request a return. Unknown until set. */
  windowDays: null as number | null,
  /** Days after delivery to report damaged or incorrect items. Unknown until set. */
  damageReportDays: null as number | null,
  verified: false,
};

export function formatRange(min: number, max: number, unit = "business days") {
  return min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
}
