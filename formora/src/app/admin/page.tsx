import Link from "next/link";
import { requireAdmin } from "@/lib/server/admin-auth";
import { attentionFlags, listOrders } from "@/lib/server/orders";
import { ensureSeeded } from "@/lib/server/seed";
import { FulfillmentBadge, PaymentBadge } from "@/components/admin/StatusBadge";
import { formatUSD } from "@/lib/money";
import type { Order } from "@/lib/server/db";

export const metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const VIEWS: { id: string; label: string; test: (o: Order) => boolean }[] = [
  { id: "attention", label: "Needs attention", test: (o) => attentionFlags(o).some((f) => f.level === "warn") },
  { id: "to-submit", label: "Awaiting submission", test: (o) => o.fulfillment.status === "awaiting_submission" && o.payment.status === "paid" },
  { id: "submitted", label: "Submitted", test: (o) => o.fulfillment.status === "submitted_to_supplier" },
  { id: "shipped", label: "Shipped", test: (o) => o.fulfillment.status === "shipped" },
  { id: "unpaid", label: "Unpaid / failed", test: (o) => o.payment.status === "awaiting_payment" || o.payment.status === "failed" },
  { id: "all", label: "All", test: () => true },
];

export default async function OrdersPage(props: PageProps<"/admin">) {
  await requireAdmin();
  await ensureSeeded();
  const { view: v } = await props.searchParams;
  const view = VIEWS.find((x) => x.id === v) ?? VIEWS[5];
  const all = await listOrders();
  const orders = all.filter(view.test);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Orders</h1>
          <p className="mt-1 text-muted">Paid orders are placed manually in Supliful, then recorded here.</p>
        </div>
      </div>

      <nav aria-label="Order filters" className="mb-4 flex flex-wrap gap-2">
        {VIEWS.map((x) => {
          const count = all.filter(x.test).length;
          const current = x.id === view.id;
          return (
            <Link
              key={x.id}
              href={x.id === "all" ? "/admin" : `/admin?view=${x.id}`}
              aria-current={current ? "page" : undefined}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium ${current ? "border-evergreen bg-evergreen text-white" : "border-line-strong bg-white hover:border-evergreen"}`}
            >
              {x.label} <span className="tabular-nums opacity-80">{count}</span>
            </Link>
          );
        })}
      </nav>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <caption className="sr-only">{view.label} orders</caption>
          <thead className="border-b border-line bg-warm text-muted">
            <tr>
              {["Order", "Date", "Payment", "Fulfillment", "Items", "Total", "Flags"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No orders in this view.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-line last:border-0 hover:bg-warm/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="link font-semibold">
                    {o.number}
                  </Link>
                  {o.synthetic && <span className="ml-2 rounded bg-[#eef0ea] px-1.5 py-0.5 text-xs text-muted">synthetic</span>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{new Date(o.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</td>
                <td className="px-4 py-3">
                  <PaymentBadge status={o.payment.status} />
                </td>
                <td className="px-4 py-3">
                  <FulfillmentBadge status={o.fulfillment.status} />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {o.items.map((i) => (
                    <div key={i.productId}>
                      {i.sku} × {i.quantity}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatUSD(o.totalCents)}</td>
                <td className="px-4 py-3">
                  {attentionFlags(o).map((f) => (
                    <div key={f.text} className={f.level === "warn" ? "font-semibold text-alert" : "text-muted"}>
                      {f.level === "warn" ? <span className="sr-only">Warning: </span> : null}
                      {f.text}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
