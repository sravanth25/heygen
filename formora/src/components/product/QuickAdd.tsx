"use client";

import { useCart } from "@/components/cart/CartProvider";

export function QuickAdd({ productId, title, available }: { productId: string; title: string; available: boolean }) {
  const { add } = useCart();
  if (!available) {
    return (
      <button type="button" className="btn btn-primary w-full" disabled>
        Currently unavailable
      </button>
    );
  }
  return (
    <button type="button" className="btn btn-primary w-full" onClick={() => add(productId, 1)}>
      Add to cart<span className="sr-only"> — {title}</span>
    </button>
  );
}
