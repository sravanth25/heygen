import type { Metadata } from "next";
import { TrackForm } from "./TrackForm";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Get a secure link to your FORMORA order status.",
  robots: { index: false },
};

export default function TrackPage() {
  return (
    <div className="container-page grid max-w-5xl gap-10 py-12 md:grid-cols-2 md:py-16">
      <div>
        <p className="eyebrow mb-3">Order status</p>
        <h1 className="text-4xl">Track an order</h1>
        <p className="mt-4 text-lg text-muted">
          Your confirmation email has a private link to your order status. Lost it? Enter your order number and email and we&apos;ll
          send it again.
        </p>
        <p className="mt-4 text-muted">
          For your privacy we never show order details from an order number alone.
        </p>
      </div>
      <TrackForm />
    </div>
  );
}
