import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getCheckoutMode } from "@/lib/readiness";
import { US_STATES, shipping, tax } from "@/config/shipping";
import { displayedPaymentMethods } from "@/config/commerce";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const mode = getCheckoutMode();
  if (mode === "disabled") {
    return (
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl">Checkout isn&apos;t open yet</h1>
        <p className="mt-4 text-lg text-muted">We&apos;re finishing a few things before we take orders. Your cart is saved on this device.</p>
        <Link href="/shop" className="btn btn-primary mt-8">
          Back to shop
        </Link>
      </div>
    );
  }
  const states = US_STATES.filter((s) => shipping.supportedStates.includes(s.code));
  return (
    <div className="container-page py-10 md:py-14">
      <h1 className="mb-2 text-4xl">Checkout</h1>
      <p className="mb-8 text-muted">Guest checkout — no account needed.</p>
      <CheckoutForm
        mode={mode}
        states={states}
        shippingCents={shipping.flatRateCents}
        taxRate={tax.demoRate}
        taxLabel={tax.label}
        paymentMethods={displayedPaymentMethods}
      />
    </div>
  );
}
