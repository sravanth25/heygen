import type { Metadata } from "next";
import { business } from "@/config/site";
import { DraftNotice, Missing } from "@/components/ui/Draft";

export const metadata: Metadata = { title: "Privacy policy (draft)", robots: { index: false } };

export default function PrivacyPage() {
  return (
    <div className="container-page max-w-3xl py-12 md:py-16">
      <h1 className="mb-6 text-4xl">Privacy policy</h1>
      <DraftNotice />
      <div className="prose-formora">
        <p>
          Effective date: <Missing>date</Missing>. This policy explains how {business.legalName ?? <Missing>legal business name</Missing>}{" "}
          (&ldquo;FORMORA&rdquo;, &ldquo;we&rdquo;) handles personal information collected through this website.
        </p>
        <h2>Information we collect</h2>
        <ul>
          <li>Order details: name, email, optional phone number, delivery address, and the products you buy.</li>
          <li>Messages you send through our contact form.</li>
          <li>
            Payment information is entered on our payment provider&apos;s secure page. We receive a payment reference and status, not
            your full card number.
          </li>
          <li>Your cart contents (product IDs and quantities) are stored in your browser so your cart persists.</li>
          <li>If you allow analytics, basic usage events (product IDs, cart values) — never your contact details or address.</li>
        </ul>
        <h2>How we use it</h2>
        <ul>
          <li>To process, fulfill, and deliver your order, and to send order and shipping updates.</li>
          <li>To answer your questions and handle returns or issues.</li>
          <li>To meet legal, tax, and accounting obligations.</li>
        </ul>
        <h2>Who we share it with</h2>
        <ul>
          <li>Our fulfillment partner, to pack and ship your order (name, address, items).</li>
          <li>Our payment provider, to take payment: <Missing>provider name</Missing>.</li>
          <li>Our email provider, to send order messages: <Missing>provider name</Missing>.</li>
          <li>Carriers, to deliver your order.</li>
        </ul>
        <p>We do not sell your personal information. <Missing>Confirm and describe any sharing for advertising, if applicable</Missing>.</p>
        <h2>Retention</h2>
        <p>
          <Missing>How long order records and messages are kept</Missing>.
        </p>
        <h2>Your choices and rights</h2>
        <p>
          Depending on your state of residence, you may have rights to access, correct, or delete your information, and to opt out of
          certain processing. <Missing>State-specific disclosures (e.g. California) and how to submit a request</Missing>.
        </p>
        <h2>Contact</h2>
        <p>
          {business.supportEmail ?? <Missing>privacy contact email</Missing>} · {business.mailingAddress ?? <Missing>mailing address</Missing>}
        </p>
      </div>
    </div>
  );
}
