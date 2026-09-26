import type { Order } from "@/lib/server/db";
import { formatUSD } from "@/lib/money";

export function OrderSummary({ order }: { order: Order }) {
  return (
    <div className="card p-6">
      <h2 className="mb-4 text-xl">Items</h2>
      <ul className="space-y-2">
        {order.items.map((i) => (
          <li key={i.productId} className="flex justify-between gap-3">
            <span>
              {i.title} <span className="text-muted">· {i.flavor} × {i.quantity}</span>
            </span>
            <span className="tabular-nums">{formatUSD(i.unitPriceCents * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-1.5 border-t border-line pt-4">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums">{formatUSD(order.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd className="tabular-nums">{formatUSD(order.shippingCents)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Sales tax{order.demoPricing ? " (demo rate)" : ""}</dt>
          <dd className="tabular-nums">{formatUSD(order.taxCents)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-lg font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatUSD(order.totalCents)}</dd>
        </div>
      </dl>
      {order.demoPricing && <p className="mt-3 rounded-lg bg-notice px-3 py-2 text-sm">Demo order — no real payment was taken.</p>}
    </div>
  );
}
