"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatUSD } from "@/lib/money";
import { track } from "@/lib/analytics";
import type { CheckoutMode } from "@/lib/readiness";

type Errors = Record<string, string>;

const FIELDS: { name: string; label: string; autoComplete: string; type?: string; optional?: boolean; half?: boolean; inputMode?: "numeric" | "tel" | "email" }[] = [
  { name: "address.firstName", label: "First name", autoComplete: "shipping given-name", half: true },
  { name: "address.lastName", label: "Last name", autoComplete: "shipping family-name", half: true },
  { name: "address.line1", label: "Street address", autoComplete: "shipping address-line1" },
  { name: "address.line2", label: "Apartment, suite, etc.", autoComplete: "shipping address-line2", optional: true },
  { name: "address.city", label: "City", autoComplete: "shipping address-level2", half: true },
];

export function CheckoutForm({
  mode,
  states,
  shippingCents,
  taxRate,
  taxLabel,
  paymentMethods,
}: {
  mode: Exclude<CheckoutMode, "disabled">;
  states: { code: string; name: string }[];
  shippingCents: number;
  taxRate: number;
  taxLabel: string;
  paymentMethods: string[];
}) {
  const { lines, subtotalCents, hydrated, hasUnavailable } = useCart();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKey = useRef<string>("");
  const tracked = useRef(false);

  useEffect(() => {
    idempotencyKey.current = crypto.randomUUID();
  }, []);

  useEffect(() => {
    if (hydrated && lines.length && !tracked.current) {
      tracked.current = true;
      track({
        name: "begin_checkout",
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        valueCents: subtotalCents,
      });
    }
  }, [hydrated, lines, subtotalCents]);

  const state = values["address.state"] ?? "";
  // Display only — the server recalculates every amount.
  const totals = useMemo(() => {
    const tax = state ? Math.round(subtotalCents * taxRate) : 0;
    return { tax, total: subtotalCents + shippingCents + tax };
  }, [state, subtotalCents, shippingCents, taxRate]);

  const set = (name: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name])
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
  };

  if (!hydrated) return <p className="text-muted">Loading checkout…</p>;
  if (lines.length === 0) {
    return (
      <div className="card flex flex-col items-start gap-4 p-8">
        <p className="text-lg font-semibold">Your cart is empty.</p>
        <Link href="/shop" className="btn btn-primary">
          Shop Formora
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError("");
    setSubmitting(true);
    const payload = {
      idempotencyKey: idempotencyKey.current,
      items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      contact: { email: values["contact.email"] ?? "", phone: values["contact.phone"] ?? "" },
      address: {
        firstName: values["address.firstName"] ?? "",
        lastName: values["address.lastName"] ?? "",
        line1: values["address.line1"] ?? "",
        line2: values["address.line2"] ?? "",
        city: values["address.city"] ?? "",
        state,
        zip: values["address.zip"] ?? "",
      },
    };
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok: boolean; redirectUrl?: string; message?: string; errors?: Errors };
      if (data.ok && data.redirectUrl) {
        window.location.assign(data.redirectUrl);
        return;
      }
      setErrors(data.errors ?? {});
      setFormError(data.message ?? "Something went wrong. Nothing was charged.");
      setSubmitting(false);
      requestAnimationFrame(() => {
        const first = data.errors && Object.keys(data.errors)[0];
        const el = first ? document.getElementById(fieldId(first)) : null;
        (el ?? document.getElementById("checkout-error"))?.focus();
      });
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again. Nothing was charged.");
      setSubmitting(false);
    }
  };

  const input = (f: (typeof FIELDS)[number] & { type?: string }) => {
    const id = fieldId(f.name);
    const err = errors[f.name];
    return (
      <div key={f.name} className={f.half ? "sm:col-span-1" : "sm:col-span-2"}>
        <label htmlFor={id} className="field-label">
          {f.label} {f.optional && <span className="font-normal text-muted">(optional)</span>}
        </label>
        <input
          id={id}
          name={f.name}
          type={f.type ?? "text"}
          inputMode={f.inputMode}
          autoComplete={f.autoComplete}
          required={!f.optional}
          value={values[f.name] ?? ""}
          onChange={set(f.name)}
          aria-invalid={err ? true : undefined}
          aria-describedby={err ? `${id}-error` : undefined}
          className="field"
        />
        {err && (
          <p id={`${id}-error`} className="field-error">
            {err}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-10">
        {formError && (
          <div id="checkout-error" tabIndex={-1} role="alert" className="rounded-xl border border-alert bg-alert-soft p-4 text-alert">
            {formError}
          </div>
        )}

        <fieldset className="space-y-4">
          <legend className="mb-4 font-display text-2xl font-semibold">Contact</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {input({ name: "contact.email", label: "Email", autoComplete: "email", type: "email", inputMode: "email" })}
            {input({ name: "contact.phone", label: "Phone", autoComplete: "tel", type: "tel", inputMode: "tel", optional: true })}
          </div>
          <p className="text-sm text-muted">
            We use your email for order updates only.
            {mode === "demo" && " In this preview, emails are not actually sent."}
          </p>
        </fieldset>

        <fieldset>
          <legend className="mb-4 font-display text-2xl font-semibold">Delivery address</legend>
          <p className="mb-4 text-sm text-muted">US addresses only.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(input)}
            <div>
              <label htmlFor={fieldId("address.state")} className="field-label">
                State
              </label>
              <select
                id={fieldId("address.state")}
                autoComplete="shipping address-level1"
                required
                value={state}
                onChange={set("address.state")}
                aria-invalid={errors["address.state"] ? true : undefined}
                aria-describedby={errors["address.state"] ? `${fieldId("address.state")}-error` : undefined}
                className="field"
              >
                <option value="">Select a state</option>
                {states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors["address.state"] && (
                <p id={`${fieldId("address.state")}-error`} className="field-error">
                  {errors["address.state"]}
                </p>
              )}
            </div>
            {input({ name: "address.zip", label: "ZIP code", autoComplete: "shipping postal-code", inputMode: "numeric", half: true })}
            <p className="text-sm text-muted sm:col-span-2">Country: United States</p>
          </div>
        </fieldset>

        <section aria-labelledby="payment-title">
          <h2 id="payment-title" className="mb-3 text-2xl">
            Payment
          </h2>
          {mode === "demo" ? (
            <div className="rounded-xl border border-[#c9a300] bg-notice p-4 text-[0.95rem]">
              <strong className="font-semibold">Demo checkout.</strong> Next you&apos;ll see a payment simulator. It asks for no card
              details and takes no payment.
            </div>
          ) : (
            <p className="text-[0.95rem] text-muted">
              You&apos;ll enter payment details on our payment provider&apos;s secure page. We never see or store your card number.
              {mode === "stripe-test" && " (Test mode: use a test card only.)"}
            </p>
          )}
          {paymentMethods.length > 0 && <p className="mt-2 text-sm text-muted">Accepted: {paymentMethods.join(", ")}</p>}
        </section>
      </div>

      <aside aria-labelledby="checkout-summary" className="h-fit lg:sticky lg:top-24">
        <div className="card space-y-4 p-6">
          <h2 id="checkout-summary" className="text-xl">
            Order summary
          </h2>
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.productId} className="flex justify-between gap-3 text-[0.95rem]">
                <span>
                  {l.item.title} <span className="text-muted">· {l.item.flavor} × {l.quantity}</span>
                  {!l.item.available && <span className="block text-sm text-alert">Unavailable — remove it from your cart</span>}
                </span>
                <span className="shrink-0 tabular-nums">{formatUSD(l.item.priceCents * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line pt-4 text-[0.95rem]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatUSD(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Shipping (flat rate)</dt>
              <dd className="tabular-nums">{formatUSD(shippingCents)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{taxLabel}</dt>
              <dd className="shrink-0 tabular-nums">{state ? formatUSD(totals.tax) : "Select a state"}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums" aria-live="polite">
                {formatUSD(totals.total)}
                {!state && <span className="sr-only"> before tax</span>}
              </dd>
            </div>
          </dl>
          {lines.some((l) => !l.item.priceConfirmed) && (
            <p className="rounded-lg bg-notice px-3 py-2 text-sm">Demo prices and demo tax rate — illustrative only.</p>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={submitting || hasUnavailable} aria-disabled={submitting || hasUnavailable}>
            {submitting ? "Starting payment…" : mode === "demo" ? "Continue to demo payment" : "Continue to secure payment"}
          </button>
          <p className="text-xs text-muted">
            By placing an order you agree to our{" "}
            <Link href="/terms" className="link">
              terms (draft)
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="link">
              privacy policy (draft)
            </Link>
            .
          </p>
        </div>
      </aside>
    </form>
  );
}

function fieldId(name: string) {
  return `f-${name.replace(".", "-")}`;
}
