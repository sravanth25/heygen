"use client";

import { useActionState } from "react";
import { sendContact, type ContactState } from "./actions";

export function ContactForm({ preview }: { preview: boolean }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContact, { status: "idle" });
  const err = (k: string) => state.errors?.[k];
  const field = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, optional = false) => (
    <div>
      <label htmlFor={`c-${name}`} className="field-label">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      <input
        id={`c-${name}`}
        name={name}
        className="field"
        aria-invalid={err(name) ? true : undefined}
        aria-describedby={err(name) ? `c-${name}-error` : undefined}
        defaultValue={state.values?.[name]}
        {...props}
      />
      {err(name) && (
        <p id={`c-${name}-error`} className="field-error">
          {err(name)}
        </p>
      )}
    </div>
  );

  if (state.status === "ok") {
    return (
      <div role="status" className="card p-8">
        <p className="text-lg font-semibold">{state.message}</p>
        {preview && <p className="mt-2 text-muted">Preview: messages are stored for the team to review, but no email reply is sent automatically.</p>}
      </div>
    );
  }

  return (
    <form action={action} className="card space-y-5 p-6 sm:p-8" noValidate>
      {state.status === "error" && state.message && (
        <p role="alert" className="rounded-lg bg-alert-soft p-3 text-alert">
          {state.message}
        </p>
      )}
      {field("name", "Name", { autoComplete: "name", required: true })}
      {field("email", "Email", { type: "email", autoComplete: "email", required: true })}
      {field("orderNumber", "Order number", { placeholder: "FM-XXXX-XXXX" }, true)}
      <div>
        <label htmlFor="c-message" className="field-label">
          Message
        </label>
        <textarea
          id="c-message"
          name="message"
          rows={6}
          required
          className="field min-h-36"
          defaultValue={state.values?.message}
          aria-invalid={err("message") ? true : undefined}
          aria-describedby={err("message") ? "c-message-error" : undefined}
        />
        {err("message") && (
          <p id="c-message-error" className="field-error">
            {err("message")}
          </p>
        )}
      </div>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? "Sending…" : "Send message"}
      </button>
      <p className="text-sm text-muted">
        For damaged or incorrect items, include your order number and describe the problem. We&apos;ll reply by email.
      </p>
    </form>
  );
}
