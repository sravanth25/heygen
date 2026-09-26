/** Banner for policy pages that still need professional review. */
export function DraftNotice() {
  return (
    <div role="note" className="mb-8 rounded-xl border-2 border-[#c9a300] bg-notice p-4">
      <p className="font-semibold">Draft — requires legal review before launch</p>
      <p className="mt-1 text-sm">
        This page is a working draft for the design preview. It is not a final policy. Highlighted items are missing business
        details.
      </p>
    </div>
  );
}

/** Visible marker for missing business information. */
export function Missing({ children }: { children: React.ReactNode }) {
  return <mark className="placeholder-text text-ink">[{children}]</mark>;
}
