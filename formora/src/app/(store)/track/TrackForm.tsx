"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestOrderLink, type TrackState } from "./actions";

export function TrackForm() {
  const [state, action, pending] = useActionState<TrackState, FormData>(requestOrderLink, { status: "idle" });
  return (
    <form action={action} className="card space-y-5 p-6 sm:p-8">
      <div>
        <label htmlFor="track-number" className="field-label">
          Order number
        </label>
        <input id="track-number" name="number" required placeholder="FM-XXXX-XXXX" autoComplete="off" className="field uppercase" />
      </div>
      <div>
        <label htmlFor="track-email" className="field-label">
          Email used at checkout
        </label>
        <input id="track-email" name="email" type="email" required autoComplete="email" className="field" />
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? "Checking…" : "Send my order link"}
      </button>
      <div aria-live="polite">
        {state.status === "error" && <p className="field-error">{state.message}</p>}
        {state.status === "sent" && (
          <div className="rounded-xl bg-warm p-4">
            <p>{state.message}</p>
            {state.previewLink && (
              <p className="mt-3 text-sm">
                <span className="rounded bg-notice px-1.5 py-0.5 font-semibold">Preview</span> Email isn&apos;t connected, so here is the
                link:{" "}
                <Link href={state.previewLink} className="link">
                  open order status
                </Link>
              </p>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
