"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { JarSvg, accentBg, displayTitle } from "@/components/product/ProductVisual";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatUSD } from "@/lib/money";

export function CartLines({ onNavigate, compact = false }: { onNavigate?: () => void; compact?: boolean }) {
  const { lines, setQuantity, remove } = useCart();
  return (
    <ul className="divide-y divide-line">
      {lines.map(({ productId, quantity, item }) => (
        <li key={productId} className="flex gap-4 py-5">
          <Link
            href={`/products/${item.slug}`}
            onClick={onNavigate}
            className={`shrink-0 overflow-hidden rounded-xl ${accentBg(item.accent)} ${compact ? "h-20 w-20" : "h-24 w-24 sm:h-28 sm:w-28"}`}
            tabIndex={-1}
            aria-hidden="true"
          >
            <JarSvg product={item} title="" className="h-full w-full p-2" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link href={`/products/${item.slug}`} onClick={onNavigate} className="font-semibold leading-snug hover:underline">
                  {displayTitle(item.title)}
                </Link>
                <p className="text-sm text-muted">
                  {item.flavor}
                  {item.netWeight ? ` · ${item.netWeight}` : ""}
                </p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">{formatUSD(item.priceCents * quantity)}</p>
            </div>
            {!item.available && (
              <p className="rounded-lg bg-alert-soft px-3 py-2 text-sm text-alert" role="alert">
                Currently unavailable. Remove it to check out.
              </p>
            )}
            <div className="mt-auto flex items-center justify-between gap-3">
              <QuantityStepper
                size="sm"
                value={quantity}
                onChange={(n) => setQuantity(productId, n)}
                label={`Quantity for ${item.title}`}
                disabled={!item.available}
              />
              <button type="button" onClick={() => remove(productId)} className="btn-ghost rounded-lg text-sm font-medium underline underline-offset-4">
                Remove<span className="sr-only"> {item.title}</span>
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
