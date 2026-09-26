import { shipping, tax } from "@/config/shipping";

export type PricedLine = { unitPriceCents: number; quantity: number };

export type Totals = {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  /** False until a delivery state is known; the UI then shows tax as pending. */
  taxCalculated: boolean;
};

/**
 * Single source of truth for order totals. The server always recomputes
 * with this function from catalog prices; browser-submitted amounts are
 * never trusted.
 */
export function computeTotals(lines: PricedLine[], opts: { state?: string } = {}): Totals {
  const subtotalCents = lines.reduce((sum, l) => sum + l.unitPriceCents * l.quantity, 0);
  const shippingCents = subtotalCents > 0 ? shipping.flatRateCents : 0;
  const taxCalculated = Boolean(opts.state);
  const taxCents = taxCalculated ? Math.round(subtotalCents * tax.demoRate) : 0;
  return {
    subtotalCents,
    shippingCents,
    taxCents,
    totalCents: subtotalCents + shippingCents + taxCents,
    taxCalculated,
  };
}
