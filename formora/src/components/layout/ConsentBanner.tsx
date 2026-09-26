"use client";

import { useSyncExternalStore } from "react";
import { analyticsProvider, CONSENT_KEY, getConsent } from "@/lib/analytics";

const listeners = new Set<() => void>();
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/**
 * Only rendered when an analytics provider is configured. Non-blocking,
 * no pre-ticked choices, and it doesn't appear as a modal on arrival.
 */
export function ConsentBanner() {
  const consent = useSyncExternalStore(subscribe, () => getConsent() ?? "unset", () => "server");
  const show = analyticsProvider() !== "none" && consent === "unset";
  if (!show) return null;

  const choose = (v: "granted" | "denied") => {
    try {
      localStorage.setItem(CONSENT_KEY, v);
    } catch {}
    listeners.forEach((l) => l());
  };
  return (
    <section
      aria-label="Analytics preferences"
      data-consent-banner
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-line bg-white p-4 shadow-lg sm:inset-x-auto sm:left-4"
    >
      <p className="text-sm">
        We&apos;d like to use basic analytics (product IDs and cart values only, no personal details) to improve the store. Is that OK?
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn btn-primary flex-1" onClick={() => choose("granted")}>
          Allow
        </button>
        <button type="button" className="btn btn-secondary flex-1" onClick={() => choose("denied")}>
          Decline
        </button>
      </div>
    </section>
  );
}
