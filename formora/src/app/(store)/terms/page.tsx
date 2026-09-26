import type { Metadata } from "next";
import Link from "next/link";
import { business, supplementDisclaimer } from "@/config/site";
import { DraftNotice, Missing } from "@/components/ui/Draft";

export const metadata: Metadata = { title: "Terms of sale (draft)", robots: { index: false } };

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-12 md:py-16">
      <h1 className="mb-6 text-4xl">Terms of sale</h1>
      <DraftNotice />
      <div className="prose-formora">
        <p>
          These terms apply to purchases from {business.legalName ?? <Missing>legal business name</Missing>} through this website.
          Effective date: <Missing>date</Missing>.
        </p>
        <h2>Orders</h2>
        <p>
          Orders are one-time purchases. There are no subscriptions or automatic recurring charges. An order is accepted once payment
          has been confirmed by our payment provider. We may cancel and refund an order if a product becomes unavailable or a price
          was displayed in error.
        </p>
        <h2>Prices and taxes</h2>
        <p>
          Prices are in US dollars. Shipping and applicable sales tax are shown before you pay. <Missing>Tax collection approach</Missing>.
        </p>
        <h2>Shipping and returns</h2>
        <p>
          See <Link href="/shipping-returns">Shipping and returns</Link>.
        </p>
        <h2>Product use</h2>
        <p>
          Use products only as directed on the label. Dietary supplements are not a substitute for a varied diet. Consult a healthcare
          professional before use if you are pregnant or nursing, take medication, or have a medical condition.
        </p>
        <p>{supplementDisclaimer}</p>
        <h2>Limitation of liability, governing law, disputes</h2>
        <p>
          <Missing>To be drafted by counsel</Missing>.
        </p>
        <h2>Contact</h2>
        <p>{business.supportEmail ?? <Missing>support email</Missing>}</p>
      </div>
    </div>
  );
}
