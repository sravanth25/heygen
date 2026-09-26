import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Payment not completed", robots: { index: false, follow: false } };

const REASONS: Record<string, string> = {
  declined: "Your payment was declined. Nothing was charged.",
  cancelled: "You left the payment page before finishing. Nothing was charged.",
  webhook: "We couldn't confirm the payment. If you see a charge, contact us and we'll sort it out.",
  not_found: "That payment session has expired or doesn't exist. Nothing was charged.",
};

export default async function FailedPage(props: PageProps<"/checkout/failed">) {
  const { reason } = await props.searchParams;
  const message = REASONS[typeof reason === "string" ? reason : ""] ?? "Your payment didn't go through. Nothing was charged.";
  return (
    <div className="container-page max-w-2xl py-16">
      <h1 className="text-4xl">Payment not completed</h1>
      <p className="mt-4 text-lg" role="alert">
        {message}
      </p>
      <p className="mt-2 text-muted">Your cart is still saved on this device.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/checkout" className="btn btn-primary">
          Try again
        </Link>
        <Link href="/cart" className="btn btn-secondary">
          Review cart
        </Link>
        <Link href="/contact" className="btn btn-ghost">
          Contact us
        </Link>
      </div>
    </div>
  );
}
