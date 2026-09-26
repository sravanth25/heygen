import type { Metadata } from "next";
import Link from "next/link";
import { findOrderByToken } from "@/lib/server/orders";
import { OrderSummary } from "@/components/order/OrderSummary";
import { AwaitConfirmation, ClearCartOnConfirmed } from "@/components/order/ClientBits";
import { CheckIcon } from "@/components/ui/icons";

export const metadata: Metadata = { title: "Order confirmation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SuccessPage(props: PageProps<"/checkout/success">) {
  const { t } = await props.searchParams;
  const token = typeof t === "string" ? t : "";
  const order = await findOrderByToken(token);

  if (!order) {
    return (
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl">We couldn&apos;t find that order</h1>
        <p className="mt-4 text-muted">The link may be incomplete. If you were charged, your confirmation email has a working link.</p>
        <Link href="/track" className="btn btn-primary mt-8">
          Find my order
        </Link>
      </div>
    );
  }

  // Status comes only from the server record, which only the verified webhook updates.
  if (order.payment.status === "awaiting_payment") {
    return (
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl">Confirming your payment</h1>
        <p className="mt-4 text-lg">
          Order <strong>{order.number}</strong> is waiting for confirmation from the payment provider. This usually takes a few seconds.
        </p>
        <div className="mt-6">
          <AwaitConfirmation />
        </div>
      </div>
    );
  }

  if (order.payment.status === "failed") {
    return (
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl">Payment not completed</h1>
        <p className="mt-4 text-lg">Nothing was charged. Your cart is still saved.</p>
        <Link href="/checkout" className="btn btn-primary mt-8">
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-12 md:py-16">
      <ClearCartOnConfirmed />
      <span className="grid h-12 w-12 place-items-center rounded-full bg-citrus text-ink">
        <CheckIcon className="h-6 w-6" />
      </span>
      <h1 className="mt-5 text-4xl">Thank you — your order is confirmed</h1>
      <p className="mt-3 text-lg text-muted">
        Order number <strong className="text-ink">{order.number}</strong>. A confirmation will be sent to {order.contact.email}.
        {order.demoPricing && " (Preview: emails are not actually sent.)"}
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <OrderSummary order={order} />
        <div className="card space-y-3 p-6">
          <h2 className="text-xl">What happens next</h2>
          <ol className="list-decimal space-y-2 pl-5 text-[0.95rem]">
            <li>We prepare your order for dispatch.</li>
            <li>When it ships, we email you the carrier and tracking number.</li>
          </ol>
          <Link href={`/orders/${token}`} className="btn btn-secondary w-full">
            View order status
          </Link>
          <p className="text-xs text-muted">Keep this link private — anyone with it can see your order status.</p>
        </div>
      </div>
    </div>
  );
}
