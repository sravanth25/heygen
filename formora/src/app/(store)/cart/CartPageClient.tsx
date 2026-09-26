"use client";

import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { CartLines } from "@/components/cart/CartLines";
import { formatUSD } from "@/lib/money";

export function CartPageClient({ shippingCents }: { shippingCents: number }) {
  const { lines, subtotalCents, hydrated, hasUnavailable } = useCart();

  if (!hydrated) return <p className="text-muted">Loading your cart…</p>;
  if (lines.length === 0) {
    return (
      <div className="card flex flex-col items-start gap-4 p-8">
        <p className="text-lg font-semibold">Your cart is empty.</p>
        <Link href="/shop" className="btn btn-primary">
          Shop Formora
        </Link>
      </div>
    );
  }

  const demo = lines.some((l) => !l.item.priceConfirmed);
  return (
    <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
      <section aria-label="Items" className="card px-5 sm:px-8">
        <CartLines />
      </section>
      <aside aria-labelledby="summary-title" className="card h-fit space-y-4 p-6 lg:sticky lg:top-24">
        <h2 id="summary-title" className="text-xl">
          Order summary
        </h2>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd className="font-semibold tabular-nums">{formatUSD(subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping (flat rate)</dt>
            <dd className="tabular-nums">{formatUSD(shippingCents)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Sales tax</dt>
            <dd>Calculated from your address at checkout</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-lg">
            <dt className="font-semibold">Estimated total</dt>
            <dd className="font-semibold tabular-nums">{formatUSD(subtotalCents + shippingCents)} + tax</dd>
          </div>
        </dl>
        {demo && <p className="rounded-lg bg-notice px-3 py-2 text-sm">Demo prices — illustrative only.</p>}
        {hasUnavailable ? (
          <>
            <button type="button" className="btn btn-primary w-full" disabled>
              Checkout
            </button>
            <p className="text-sm text-alert" role="alert">
              Remove unavailable items to continue.
            </p>
          </>
        ) : (
          <Link href="/checkout" className="btn btn-primary w-full">
            Checkout
          </Link>
        )}
        <p className="text-sm text-muted">Guest checkout — no account needed. One-time purchase.</p>
      </aside>
    </div>
  );
}
