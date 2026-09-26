"use client";

import { useState } from "react";

/** Email signup is NOT connected to any service. Nothing is stored or sent. */
export function NewsletterDemo() {
  const [done, setDone] = useState(false);
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        setDone(true);
      }}
    >
      <label htmlFor="newsletter-email" className="block font-semibold">
        Launch updates <span className="ml-1 rounded-full bg-citrus px-2 py-0.5 text-xs font-semibold text-ink">Demo</span>
      </label>
      <p className="text-sm text-white/75">Not connected yet — your email won&apos;t be stored or sent anywhere.</p>
      <div className="flex gap-2">
        <input id="newsletter-email" type="email" required autoComplete="email" placeholder="you@example.com" className="field min-w-0 flex-1 border-white/30" />
        <button type="submit" className="btn btn-citrus shrink-0">
          Sign up
        </button>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-citrus">
        {done ? "Demo only: nothing was saved." : ""}
      </p>
    </form>
  );
}
