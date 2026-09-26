import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/server/admin-auth";
import { attentionFlags, getOrderById } from "@/lib/server/orders";
import { FulfillmentBadge, PaymentBadge } from "@/components/admin/StatusBadge";
import { FulfillmentControls, NoteForm, RefundForm, SubmitToSupplierForm, TrackingForm } from "@/components/admin/OrderForms";
import { formatUSD } from "@/lib/money";
import { shipping } from "@/config/shipping";
import { getProduct } from "@/config/products";

export const metadata = { title: "Order" };
export const dynamic = "force-dynamic";

const dt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—");

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6" aria-label={title}>
      <h2 className="mb-4 font-sans text-base font-semibold tracking-normal">{title}</h2>
      {children}
    </section>
  );
}

export default async function AdminOrderPage(props: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await props.params;
  const o = await getOrderById(id);
  if (!o) notFound();

  const a = o.address;
  const f = o.fulfillment;
  const paid = o.payment.status === "paid";
  const flags = attentionFlags(o);
  const everPaid = Boolean(o.payment.paidAt);
  const step = f.status === "shipped" ? 6 : f.status === "submitted_to_supplier" ? 4 : everPaid ? 2 : 1;

  const steps = [
    "Payment verified",
    "Place order in Supliful",
    "Record Supliful order ID",
    "Add tracking when shipped",
    "Customer notified",
  ];

  return (
    <>
      <p className="mb-2 text-sm">
        <Link href="/admin" className="link">
          ← All orders
        </Link>
      </p>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl">{o.number}</h1>
        <PaymentBadge status={o.payment.status} />
        <FulfillmentBadge status={f.status} />
        {o.synthetic && <span className="rounded bg-white px-2 py-0.5 text-xs text-muted">Synthetic record</span>}
        {o.demoPricing && <span className="rounded bg-notice px-2 py-0.5 text-xs">Demo pricing</span>}
      </div>

      {flags.length > 0 && (
        <ul className="mb-6 space-y-2">
          {flags.map((fl) => (
            <li key={fl.text} className={`rounded-lg p-3 text-sm ${fl.level === "warn" ? "bg-alert-soft font-semibold text-alert" : "bg-white text-muted"}`}>
              {fl.text}
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <Card title="Fulfillment workflow">
            <ol className="mb-6 grid gap-2 sm:grid-cols-5">
              {steps.map((s, i) => {
                const n = i + 1;
                const done = n < step;
                return (
                  <li key={s} className={`rounded-lg border p-2.5 text-xs ${done ? "border-evergreen bg-[#eef5ef]" : n === step ? "border-[#c9a300] bg-notice" : "border-line text-muted"}`}>
                    <span className="block font-semibold">
                      {done ? "Done" : n === step ? "Next" : `Step ${n}`}
                    </span>
                    {s}
                  </li>
                );
              })}
            </ol>

            {!paid && o.payment.status !== "refunded" && o.payment.status !== "partially_refunded" && (
              <p className="rounded-lg bg-warm p-4 text-sm">
                Payment is <strong>{o.payment.status.replaceAll("_", " ")}</strong>. Do not place this order in Supliful. Orders become
                ready only after a verified payment webhook.
              </p>
            )}

            {paid && f.status === "awaiting_submission" && (
              <div className="space-y-4">
                <ol className="list-decimal space-y-1 pl-5 text-sm">
                  <li>Open your Supliful dashboard and create a new order.</li>
                  <li>Add the products and quantities listed under “Items” below (use the Supliful product names).</li>
                  <li>Copy the delivery address exactly from the panel on the right.</li>
                  <li>Complete the order in Supliful, then enter its order ID here.</li>
                </ol>
                <SubmitToSupplierForm orderId={o.id} />
              </div>
            )}

            {(f.status === "submitted_to_supplier" || f.status === "shipped") && (
              <div className="space-y-4">
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted">Supliful order ID</dt>
                  <dd className="font-mono">{f.suplifulOrderId}</dd>
                  <dt className="text-muted">Submitted</dt>
                  <dd>
                    {dt(f.submittedAt)} by {f.submittedBy}
                  </dd>
                  {f.status === "shipped" && (
                    <>
                      <dt className="text-muted">Tracking</dt>
                      <dd>
                        {f.carrier} <span className="font-mono">{f.trackingNumber}</span>
                        {f.trackingUrl && (
                          <>
                            {" "}
                            ·{" "}
                            <a href={f.trackingUrl} className="link" target="_blank" rel="noopener noreferrer">
                              open
                            </a>
                          </>
                        )}
                      </dd>
                      <dt className="text-muted">Shipped</dt>
                      <dd>{dt(f.shippedAt)}</dd>
                    </>
                  )}
                </dl>
                <p className="text-sm text-muted">
                  {f.status === "submitted_to_supplier"
                    ? "Submitted is not shipped. Add tracking only once Supliful confirms the shipment."
                    : "Updating tracking queues another shipment email."}
                </p>
                <TrackingForm orderId={o.id} carriers={shipping.carriers} existing={f.status === "shipped" ? f : undefined} />
              </div>
            )}

            {(f.status === "on_hold" || f.status === "cancelled") && (
              <p className="rounded-lg bg-warm p-4 text-sm">Fulfillment is {f.status.replaceAll("_", " ")}. See the audit history for the reason.</p>
            )}
          </Card>

          <Card title="Items">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-left text-sm">
                <thead className="text-muted">
                  <tr className="border-b border-line">
                    <th scope="col" className="py-2 pr-3 font-semibold">Website SKU</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Supliful product</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">Qty</th>
                    <th scope="col" className="py-2 text-right font-semibold">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {o.items.map((i) => (
                    <tr key={i.productId} className="border-b border-line last:border-0">
                      <td className="py-2 pr-3">
                        <span className="font-mono">{i.sku}</span>
                        <span className="block text-muted">
                          {i.title} · {i.flavor}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        {i.supplierProductName} — {i.supplierVariant}
                        {getProduct(i.productId) && (
                          <a href={getProduct(i.productId)!.supplier.catalogUrl} target="_blank" rel="noopener noreferrer" className="link block text-xs">
                            Supliful catalog page
                          </a>
                        )}
                      </td>
                      <td className="py-2 pr-3 text-base font-semibold">{i.quantity}</td>
                      <td className="py-2 text-right tabular-nums">{formatUSD(i.unitPriceCents * i.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-4 ml-auto max-w-xs space-y-1 text-sm">
              {[
                ["Subtotal", o.subtotalCents],
                ["Shipping", o.shippingCents],
                ["Tax", o.taxCents],
                ["Total", o.totalCents],
              ].map(([k, v]) => (
                <div key={k} className={`flex justify-between ${k === "Total" ? "border-t border-line pt-1 font-semibold" : ""}`}>
                  <dt>{k}</dt>
                  <dd className="tabular-nums">{formatUSD(v as number)}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card title="Audit history">
            <ol className="space-y-3 text-sm">
              {[...o.audit].reverse().map((e, i) => (
                <li key={i} className="border-l-2 border-line pl-3">
                  <span className="font-semibold">{e.action}</span>
                  {e.detail && <span className="text-muted"> — {e.detail}</span>}
                  <span className="block text-xs text-muted">
                    {dt(e.at)} · {e.actor}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer and delivery">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted">Email</dt>
                <dd>{o.contact.email}</dd>
              </div>
              {o.contact.phone && (
                <div>
                  <dt className="text-muted">Phone</dt>
                  <dd>{o.contact.phone}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted">Delivery address (copy into Supliful)</dt>
                <dd className="mt-1 rounded-lg bg-warm p-3 font-mono text-[0.8rem] leading-relaxed select-all">
                  {a.firstName} {a.lastName}
                  <br />
                  {a.line1}
                  {a.line2 && (
                    <>
                      <br />
                      {a.line2}
                    </>
                  )}
                  <br />
                  {a.city}, {a.state} {a.zip}
                  <br />
                  United States
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Payment">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted">Provider</dt>
              <dd>{o.payment.provider === "demo" ? "Demo simulator (no real payment)" : "Stripe"}</dd>
              <dt className="text-muted">Status</dt>
              <dd>
                <PaymentBadge status={o.payment.status} />
              </dd>
              <dt className="text-muted">Reference</dt>
              <dd className="font-mono break-all">{o.payment.reference ?? "—"}</dd>
              <dt className="text-muted">Session</dt>
              <dd className="font-mono break-all">{o.payment.sessionId || "—"}</dd>
              <dt className="text-muted">Paid at</dt>
              <dd>{dt(o.payment.paidAt)}</dd>
              {o.payment.refundedCents > 0 && (
                <>
                  <dt className="text-muted">Refunded</dt>
                  <dd>{formatUSD(o.payment.refundedCents)}</dd>
                </>
              )}
              {o.payment.failureReason && (
                <>
                  <dt className="text-muted">Failure</dt>
                  <dd>{o.payment.failureReason}</dd>
                </>
              )}
            </dl>
            {(o.payment.status === "paid" || o.payment.status === "partially_refunded") && (
              <div className="mt-5 border-t border-line pt-5">
                <RefundForm orderId={o.id} maxDollars={((o.totalCents - o.payment.refundedCents) / 100).toFixed(2)} />
              </div>
            )}
          </Card>

          <Card title="Internal notes">
            {o.notes.length > 0 && (
              <ul className="mb-4 space-y-3 text-sm">
                {o.notes.map((n, i) => (
                  <li key={i} className="rounded-lg bg-warm p-3">
                    <p className="whitespace-pre-wrap">{n.text}</p>
                    <p className="mt-1 text-xs text-muted">
                      {dt(n.at)} · {n.by}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <NoteForm orderId={o.id} />
          </Card>

          {!["shipped", "cancelled", "not_ready"].includes(f.status) && (
            <Card title="Hold or cancel fulfillment">
              <FulfillmentControls orderId={o.id} status={f.status} />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
