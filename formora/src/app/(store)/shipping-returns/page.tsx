import type { Metadata } from "next";
import Link from "next/link";
import { shipping, returns } from "@/config/shipping";
import { business } from "@/config/site";
import { policies } from "@/config/commerce";
import { formatUSD } from "@/lib/money";
import { processingText, transitText, shippingEstimatesVerified } from "@/lib/shipping-copy";
import { DraftNotice, Missing } from "@/components/ui/Draft";

export const metadata: Metadata = {
  title: "Shipping and returns",
  description: "Where FORMORA ships, processing and delivery estimates, and how returns and damaged orders are handled.",
  alternates: { canonical: "/shipping-returns" },
};

export default function ShippingReturnsPage() {
  return (
    <div className="container-page max-w-3xl py-12 md:py-16">
      <h1 className="mb-6 text-4xl">Shipping and returns</h1>
      {policies.shippingReturns.draft && <DraftNotice />}

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Processing", processingText(), "Preparing and dispatching your order"],
          ["Delivery", transitText(), "In transit with the carrier, after dispatch"],
          ["Shipping cost", formatUSD(shipping.flatRateCents), "Flat rate per order"],
        ].map(([k, v, d]) => (
          <div key={k} className="card p-5">
            <p className="text-sm font-semibold text-muted">{k}</p>
            <p className="mt-1 font-display text-2xl font-semibold">{v}</p>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </div>
      {!shippingEstimatesVerified() && (
        <p className="-mt-6 mb-10 text-sm text-muted">These figures are placeholders pending confirmation with our fulfillment partner.</p>
      )}

      <div className="prose-formora">
        <h2>Where we ship</h2>
        <p>We ship to addresses in {shipping.destinationLabel}. We don&apos;t currently ship internationally.</p>

        <h2>Processing and delivery</h2>
        <p>
          Processing and delivery are separate. Processing is the time to prepare and dispatch your order ({processingText()}).
          Delivery is the carrier&apos;s transit time after dispatch ({transitText()}). Business days exclude weekends and US federal
          holidays. Both are estimates, not guarantees.
        </p>
        <p>
          Orders are shipped by our fulfillment partner. When your order ships, we&apos;ll email the carrier and tracking number. You
          can also check status any time from your <Link href="/track">order-status link</Link>.
        </p>

        <h2>Returns</h2>
        {returns.windowDays === null ? (
          <p>
            You may request a return within <Missing>return window — days after delivery</Missing>. Because these are consumable
            products, <Missing>condition requirements, e.g. unopened and unused</Missing>. Refunds are issued to the original payment
            method <Missing>refund timing</Missing>. <Missing>Who pays return shipping</Missing>.
          </p>
        ) : (
          <p>You may request a return within {returns.windowDays} days of delivery.</p>
        )}

        <h2>Damaged, incorrect, or missing items</h2>
        <p>
          If your order arrives damaged, incorrect, or incomplete, contact us within{" "}
          {returns.damageReportDays ? `${returns.damageReportDays} days` : <Missing>reporting period</Missing>} of delivery with your
          order number and a photo of the item and packaging. We&apos;ll arrange a replacement or refund.
        </p>

        <h2>Cancellations and address changes</h2>
        <p>
          Contact us as soon as possible. Once an order has been passed to our fulfillment partner for dispatch, we may not be able
          to change or cancel it.
        </p>

        <h2>Contact</h2>
        <p>
          {business.supportEmail ? business.supportEmail : <Missing>support email</Missing>} ·{" "}
          <Link href="/contact">Contact form</Link>
        </p>
      </div>
    </div>
  );
}
