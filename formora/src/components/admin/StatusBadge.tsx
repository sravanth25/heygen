import type { FulfillmentStatus, PaymentStatus } from "@/lib/server/db";

const PAY: Record<PaymentStatus, [string, string]> = {
  awaiting_payment: ["Awaiting payment", "bg-[#eef0ea] text-muted"],
  paid: ["Paid", "bg-[#dcefd9] text-[#1d4d23]"],
  failed: ["Failed", "bg-alert-soft text-alert"],
  refunded: ["Refunded", "bg-[#ece3f5] text-[#4b2a6b]"],
  partially_refunded: ["Partly refunded", "bg-[#ece3f5] text-[#4b2a6b]"],
};
const FUL: Record<FulfillmentStatus, [string, string]> = {
  not_ready: ["Not ready", "bg-[#eef0ea] text-muted"],
  awaiting_submission: ["Awaiting submission", "bg-notice text-ink"],
  submitted_to_supplier: ["Submitted to Supliful", "bg-[#dde9f5] text-[#1d3d5c]"],
  shipped: ["Shipped", "bg-[#dcefd9] text-[#1d4d23]"],
  on_hold: ["On hold", "bg-peach-soft text-ink"],
  cancelled: ["Cancelled", "bg-[#eef0ea] text-muted line-through"],
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const [l, c] = PAY[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${c}`}>{l}</span>;
}
export function FulfillmentBadge({ status }: { status: FulfillmentStatus }) {
  const [l, c] = FUL[status];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${c}`}>{l}</span>;
}
