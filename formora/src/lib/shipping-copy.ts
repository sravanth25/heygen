import { shipping, returns, formatRange } from "@/config/shipping";
import { formatUSD } from "@/lib/money";

export const processingText = () => formatRange(shipping.processing.minBusinessDays, shipping.processing.maxBusinessDays);
export const transitText = () => formatRange(shipping.transit.minBusinessDays, shipping.transit.maxBusinessDays);
export const shippingEstimatesVerified = () => shipping.processing.verified && shipping.transit.verified && shipping.rateVerified;

export function shippingSummary() {
  return {
    rate: `${formatUSD(shipping.flatRateCents)} flat rate per order`,
    processing: `Orders are prepared in ${processingText()}`,
    transit: `then delivered in ${transitText()} after dispatch`,
    verified: shippingEstimatesVerified(),
  };
}

export function returnsSummary() {
  if (returns.windowDays === null) {
    return "Return and damaged-order policy is being finalized. Contact us about any problem with an order.";
  }
  return `Request a return within ${returns.windowDays} days of delivery.`;
}
