"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { CartLines } from "./CartLines";
import { Modal } from "@/components/ui/Modal";
import { CloseIcon } from "@/components/ui/icons";
import { formatUSD } from "@/lib/money";

export function CartDrawer({ shippingCents }: { shippingCents: number }) {
  const { drawerOpen, closeDrawer, lines, count, subtotalCents, hasUnavailable } = useCart();
  const router = useRouter();

  return (
    <Modal
      open={drawerOpen}
      onClose={closeDrawer}
      labelledBy="cart-drawer-title"
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-md bg-warm p-0 text-ink"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <h2 id="cart-drawer-title" className="text-xl">
            Your cart {count > 0 && <span className="font-sans text-base font-normal text-muted">({count})</span>}
          </h2>
          <button type="button" onClick={closeDrawer} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white" aria-label="Close cart">
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-lg font-semibold">Your cart is empty.</p>
            <p className="text-muted">Two powders, one decision. Compare them and pick your fit.</p>
            <Link href="/shop" onClick={closeDrawer} className="btn btn-primary">
              Shop Formora
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <CartLines onNavigate={closeDrawer} compact />
            </div>
            <div className="shrink-0 space-y-3 border-t border-line bg-white px-5 py-5">
              <dl className="space-y-1.5 text-[0.95rem]">
                <div className="flex justify-between">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold tabular-nums">{formatUSD(subtotalCents)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>Shipping (flat rate)</dt>
                  <dd className="tabular-nums">{formatUSD(shippingCents)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>Sales tax</dt>
                  <dd>Shown at checkout</dd>
                </div>
              </dl>
              <button
                type="button"
                className="btn btn-primary w-full"
                disabled={hasUnavailable}
                onClick={() => {
                  closeDrawer();
                  router.push("/checkout");
                }}
              >
                Checkout
              </button>
              {hasUnavailable && <p className="text-sm text-alert">Remove unavailable items to continue.</p>}
              <Link href="/cart" onClick={closeDrawer} className="btn btn-secondary w-full">
                View full cart
              </Link>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
