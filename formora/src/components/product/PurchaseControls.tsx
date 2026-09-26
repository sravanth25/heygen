"use client";

import { useEffect, useRef, useState } from "react";
import { useCart, MAX_QTY } from "@/components/cart/CartProvider";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { formatUSD } from "@/lib/money";
import { track } from "@/lib/analytics";

export function PurchaseControls({
  productId,
  title,
  flavor,
  priceCents,
  priceConfirmed,
  available,
}: {
  productId: string;
  title: string;
  flavor: string;
  priceCents: number;
  priceConfirmed: boolean;
  available: boolean;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [showBar, setShowBar] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    track({ name: "product_viewed", productId, valueCents: priceCents });
  }, [productId, priceCents]);

  // Show a compact purchase bar on small screens once the main button has
  // scrolled out of view above the viewport.
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      setShowBar(el.getBoundingClientRect().bottom < 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("has-purchase-bar", showBar);
    return () => document.body.classList.remove("has-purchase-bar");
  }, [showBar]);

  const addToCart = () => add(productId, qty);

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <span className="field-label" id="qty-label">
            Quantity
          </span>
          <QuantityStepper value={qty} onChange={setQty} max={MAX_QTY} label="Quantity" disabled={!available} />
        </div>
        <button ref={buttonRef} type="button" onClick={addToCart} disabled={!available} className="btn btn-primary min-w-0 flex-1 text-[1.05rem]">
          {available ? (
            <>
              Add to cart<span className="hidden sm:inline">
                {" "}
                · <span className="tabular-nums">{formatUSD(priceCents * qty)}</span>
              </span>
            </>
          ) : (
            "Currently unavailable"
          )}
        </button>
      </div>
      {!available && <p className="mt-2 text-sm text-alert">This product is temporarily unavailable. We don&apos;t take backorders.</p>}

      {available && (
        <div
          className={`on-dark fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-evergreen text-white transition-transform lg:hidden ${
            showBar ? "translate-y-0" : "pointer-events-none translate-y-full"
          } [body:has([data-consent-banner])_&]:hidden`}
          aria-hidden={!showBar}
          inert={!showBar}
        >
          <div className="container-page flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{title}</p>
              <p className="text-sm text-white/75">
                {flavor} · <span className="tabular-nums">{formatUSD(priceCents)}</span>
                {!priceConfirmed && " (demo)"}
              </p>
            </div>
            <button type="button" onClick={addToCart} className="btn btn-citrus shrink-0">
              Add to cart
            </button>
          </div>
        </div>
      )}
    </>
  );
}
