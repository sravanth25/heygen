import type { Metadata } from "next";
import { CartPageClient } from "./CartPageClient";
import { shipping } from "@/config/shipping";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-page py-12 md:py-16">
      <h1 className="mb-8 text-4xl">Your cart</h1>
      <CartPageClient shippingCents={shipping.flatRateCents} />
    </div>
  );
}
