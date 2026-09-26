import type { Metadata } from "next";
import Link from "next/link";
import { findOrderByToken } from "@/lib/server/orders";
import { OrderSummary } from "@/components/order/OrderSummary";
import type { Order } from "@/lib/server/db";

export const metadata: Metadata = { title: "Order status", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;

/** Customer-facing steps. Supplier details stay in the admin area. */
function steps(o: Order) {
  const paid = o.payment.status === "paid" || o.payment.status.includes("refunded");
  const f = o.fulfillment.status;
  return [
    { label: "Order placed", done: true, date: fmt(o.createdAt) },
    { label: "Payment confirmed", done: paid, date: fmt(o.payment.paidAt) },
    { label: "Being prepared", done: f === "submitted_to_supplier" || f === "shipped", date: fmt(o.fulfillment.submittedAt) },
    { label: "Shipped", done: f === "shipped", date: fmt(o.fulfillment.shippedAt) },
  ];
}

export default async function OrderStatusPage(props: PageProps<"/orders/[token]">) {
  const { token } = await props.params;
  const order = await findOrderByToken(token);

  if (!order) {
    return (
      <div className="container-page max-w-2xl py-16">
        <h1 className="text-4xl">Order link not recognized</h1>
        <p className="mt-4 text-muted">Check that you copied the whole link, or request a new one.</p>
        <Link href="/track" className="btn btn-primary mt-8">
          Request a new link
        </Link>
      </div>
    );
  }

  const f = order.fulfillment;
  const a = order.address;
  return (
    <div className="container-page max-w-4xl py-12 md:py-16">
      <p className="eyebrow mb-2">Order status</p>
      <h1 className="text-4xl">Order {order.number}</h1>
      <p className="mt-2 text-muted">Placed {fmt(order.createdAt)}</p>

      {order.payment.status === "failed" && (
        <p className="mt-6 rounded-xl bg-alert-soft p-4 text-alert">Payment was not completed for this order, so it won&apos;t ship.</p>
      )}
      {order.payment.status.includes("refunded") && (
        <p className="mt-6 rounded-xl bg-warm p-4">A refund has been issued for this order{order.payment.status === "partially_refunded" ? " (partial)" : ""}.</p>
      )}
      {f.status === "cancelled" && <p className="mt-6 rounded-xl bg-warm p-4">This order was cancelled.</p>}

      {order.payment.status !== "failed" && f.status !== "cancelled" && (
        <ol className="mt-8 grid gap-4 sm:grid-cols-4" aria-label="Order progress">
          {steps(order).map((s) => (
            <li key={s.label} className={`rounded-xl border p-4 ${s.done ? "border-evergreen bg-white" : "border-line text-muted"}`}>
              <span className="sr-only">{s.done ? "Completed: " : "Not yet: "}</span>
              <span className="block font-semibold">{s.label}</span>
              {s.done && s.date && <span className="text-sm text-muted">{s.date}</span>}
            </li>
          ))}
        </ol>
      )}

      {f.status === "shipped" && f.trackingNumber && (
        <div className="card mt-6 p-6">
          <h2 className="text-xl">Tracking</h2>
          <p className="mt-2">
            {f.carrier} · <span className="font-mono">{f.trackingNumber}</span>
          </p>
          {f.trackingUrl && (
            <a href={f.trackingUrl} className="btn btn-primary mt-4" target="_blank" rel="noopener noreferrer">
              Track with {f.carrier}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <OrderSummary order={order} />
        <div className="card p-6">
          <h2 className="text-xl">Delivering to</h2>
          <p className="mt-2">
            {a.firstName} {a.lastName.slice(0, 1)}.
            <br />
            {a.city}, {a.state} {a.zip.slice(0, 3)}••
          </p>
          <p className="mt-4 text-sm text-muted">
            Need to change something? <Link href="/contact" className="link">Contact us</Link> with your order number.
          </p>
        </div>
      </div>
    </div>
  );
}
