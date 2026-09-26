"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

/** Clears the cart once the server has confirmed payment. */
export function ClearCartOnConfirmed() {
  const { clear, hydrated } = useCart();
  const done = useRef(false);
  useEffect(() => {
    if (hydrated && !done.current) {
      done.current = true;
      clear();
    }
  }, [hydrated, clear]);
  return null;
}

/** Re-renders the server page while we wait for the payment webhook. */
export function AwaitConfirmation({ maxTries = 15 }: { maxTries?: number }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  useEffect(() => {
    if (tries >= maxTries) return;
    const id = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, 2000);
    return () => clearTimeout(id);
  }, [tries, maxTries, router]);
  return tries >= maxTries ? (
    <p className="text-muted">
      This is taking longer than usual. You don&apos;t need to pay again — refresh this page in a few minutes or use the order-status link.
    </p>
  ) : (
    <p className="text-muted" role="status">
      Checking with the payment provider…
    </p>
  );
}
