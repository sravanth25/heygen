import type { Metadata } from "next";
import Link from "next/link";
import { business } from "@/config/site";
import { isPreview } from "@/lib/readiness";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact FORMORA customer support about products or orders.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="container-page grid max-w-5xl gap-10 py-12 md:grid-cols-[1fr_1.3fr] md:py-16">
      <div>
        <p className="eyebrow mb-3">Support</p>
        <h1 className="text-4xl">Contact us</h1>
        <p className="mt-4 text-lg text-muted">Questions about a product or an order? Send us a message.</p>
        <dl className="mt-8 space-y-4">
          {business.supportEmail && (
            <div>
              <dt className="font-semibold">Email</dt>
              <dd>
                <a href={`mailto:${business.supportEmail}`} className="link">
                  {business.supportEmail}
                </a>
              </dd>
            </div>
          )}
          {business.supportHours && (
            <div>
              <dt className="font-semibold">Hours</dt>
              <dd>{business.supportHours}</dd>
            </div>
          )}
          {business.responseTime && (
            <div>
              <dt className="font-semibold">Response time</dt>
              <dd>{business.responseTime}</dd>
            </div>
          )}
        </dl>
        {!business.supportEmail && (
          <p className="mt-6 rounded-xl bg-notice p-4 text-sm">Direct support email and hours will be published before launch.</p>
        )}
        <p className="mt-6 text-muted">
          Looking for an order? <Link href="/track" className="link">Track it here</Link>.
        </p>
      </div>
      <ContactForm preview={isPreview()} />
    </div>
  );
}
