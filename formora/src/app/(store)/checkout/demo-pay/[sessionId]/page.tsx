import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findOrderByToken } from "@/lib/server/orders";
import { getCheckoutMode } from "@/lib/readiness";
import { formatUSD } from "@/lib/money";
import { simulatePayment } from "./actions";

export const metadata: Metadata = { title: "Demo payment", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DemoPayPage(props: PageProps<"/checkout/demo-pay/[sessionId]">) {
  if (getCheckoutMode() !== "demo") notFound();
  const { sessionId } = await props.params;
  const { t } = await props.searchParams;
  const token = typeof t === "string" ? t : "";
  const order = await findOrderByToken(token);
  if (!order || order.payment.sessionId !== sessionId) notFound();

  const done = order.payment.status !== "awaiting_payment";

  return (
    <div className="container-page max-w-xl py-12 md:py-16">
      <div className="rounded-2xl border-2 border-dashed border-[#c9a300] bg-white p-6 sm:p-8">
        <p className="mb-3 inline-block rounded-full bg-notice px-3 py-1 text-sm font-semibold">Payment simulator — demo only</p>
        <h1 className="text-3xl">Simulate a payment</h1>
        <p className="mt-3 text-muted">
          This stands in for a payment provider&apos;s hosted checkout page. It never asks for card details, and no money moves.
          Choosing an outcome sends a signed webhook to the store, which is the only thing that can mark an order paid.
        </p>

        <dl className="my-6 space-y-2 rounded-xl bg-warm p-4">
          <div className="flex justify-between">
            <dt>Order</dt>
            <dd className="font-semibold">{order.number}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Amount (server-calculated)</dt>
            <dd className="font-semibold tabular-nums">{formatUSD(order.totalCents)}</dd>
          </div>
        </dl>

        {done ? (
          <p role="status" className="rounded-lg bg-warm p-4">
            This payment session is already complete (status: {order.payment.status.replaceAll("_", " ")}).
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <form action={simulatePayment}>
              <input type="hidden" name="t" value={token} />
              <input type="hidden" name="outcome" value="succeed" />
              <button type="submit" className="btn btn-primary w-full">
                Simulate successful payment
              </button>
            </form>
            <form action={simulatePayment}>
              <input type="hidden" name="t" value={token} />
              <input type="hidden" name="outcome" value="fail" />
              <button type="submit" className="btn btn-secondary w-full">
                Simulate declined payment
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
