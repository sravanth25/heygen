"use client";

import { startTransition, useActionState } from "react";
import {
  addNoteAction,
  addTrackingAction,
  fulfillmentAction,
  recordRefundAction,
  submitToSupplierAction,
  type ActionState,
} from "@/app/admin/actions";

/**
 * Submit without React's automatic form reset, so typed values survive a
 * validation error.
 */
function keepValues(action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name) fd.set(submitter.name, submitter.value);
    startTransition(() => action(fd));
  };
}

function Result({ state }: { state: ActionState }) {
  if (state.error)
    return (
      <p role="alert" className="rounded-lg bg-alert-soft p-3 text-sm text-alert">
        {state.error}
      </p>
    );
  if (state.message)
    return (
      <p role="status" className="rounded-lg bg-[#dcefd9] p-3 text-sm text-[#1d4d23]">
        {state.message}
      </p>
    );
  return null;
}

export function SubmitToSupplierForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitToSupplierAction, {});
  return (
    <form onSubmit={keepValues(action)} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <div>
        <label htmlFor="sid" className="field-label">
          Supliful order ID
        </label>
        <input id="sid" name="suplifulOrderId" required autoComplete="off" className="field max-w-sm font-mono" placeholder="As shown in your Supliful dashboard" />
      </div>
      <label className="flex min-h-11 items-start gap-3">
        <input type="checkbox" name="confirm" className="mt-1 h-5 w-5 accent-evergreen" />
        <span className="text-sm">I placed this order in Supliful, and the products, quantities, and delivery address match this order.</span>
      </label>
      <Result state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : "Mark as submitted to Supliful"}
      </button>
    </form>
  );
}

export function TrackingForm({ orderId, carriers, existing }: { orderId: string; carriers: readonly string[]; existing?: { carrier: string | null; trackingNumber: string | null } }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addTrackingAction, {});
  return (
    <form onSubmit={keepValues(action)} className="space-y-4">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="carrier" className="field-label">
            Carrier
          </label>
          <select id="carrier" name="carrier" required defaultValue={existing?.carrier ?? ""} className="field">
            <option value="">Select carrier</option>
            {carriers.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="tn" className="field-label">
            Tracking number
          </label>
          <input id="tn" name="trackingNumber" required defaultValue={existing?.trackingNumber ?? ""} className="field font-mono" autoComplete="off" />
        </div>
      </div>
      <div>
        <label htmlFor="turl" className="field-label">
          Tracking link <span className="font-normal text-muted">(optional — generated for USPS, UPS, FedEx, DHL)</span>
        </label>
        <input id="turl" name="trackingUrl" type="url" className="field" placeholder="https://" />
      </div>
      <Result state={state} />
      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? "Saving…" : existing?.trackingNumber ? "Update tracking" : "Save tracking and mark shipped"}
      </button>
    </form>
  );
}

export function NoteForm({ orderId }: { orderId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(addNoteAction, {});
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label htmlFor="note" className="field-label">
        Add internal note
      </label>
      <textarea id="note" name="note" rows={3} className="field" required />
      <Result state={state} />
      <button type="submit" disabled={pending} className="btn btn-secondary">
        Add note
      </button>
    </form>
  );
}

export function RefundForm({ orderId, maxDollars }: { orderId: string; maxDollars: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(recordRefundAction, {});
  return (
    <form onSubmit={keepValues(action)} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <p className="text-sm text-muted">
        Issue the refund in your payment provider first, then record it here. Recording a refund does not cancel the Supliful order.
      </p>
      <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
        <div>
          <label htmlFor="ramt" className="field-label">
            Amount ($)
          </label>
          <input id="ramt" name="amount" inputMode="decimal" required placeholder={maxDollars} className="field" />
        </div>
        <div>
          <label htmlFor="rreason" className="field-label">
            Reason
          </label>
          <input id="rreason" name="reason" className="field" />
        </div>
      </div>
      <Result state={state} />
      <button type="submit" disabled={pending} className="btn btn-secondary">
        Record refund
      </button>
    </form>
  );
}

export function FulfillmentControls({ orderId, status }: { orderId: string; status: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(fulfillmentAction, {});
  return (
    <form onSubmit={keepValues(action)} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <label htmlFor="freason" className="field-label">
        Reason <span className="font-normal text-muted">(required to cancel)</span>
      </label>
      <input id="freason" name="reason" className="field" />
      <Result state={state} />
      <div className="flex flex-wrap gap-2">
        {status === "awaiting_submission" && (
          <button name="op" value="hold" disabled={pending} className="btn btn-secondary">
            Put on hold
          </button>
        )}
        {status === "on_hold" && (
          <button name="op" value="release" disabled={pending} className="btn btn-secondary">
            Release hold
          </button>
        )}
        {status !== "shipped" && status !== "cancelled" && (
          <button name="op" value="cancel" disabled={pending} className="btn btn-ghost text-alert">
            Record fulfillment cancelled
          </button>
        )}
      </div>
      {status === "submitted_to_supplier" && (
        <p className="text-xs text-muted">Cancel the order in Supliful first — this only records that you did.</p>
      )}
    </form>
  );
}
