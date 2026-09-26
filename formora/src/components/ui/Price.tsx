import { formatUSD } from "@/lib/money";

/** Price with an explicit "Demo price" tag while prices are unconfirmed. */
export function Price({
  cents,
  confirmed,
  className = "",
  size = "md",
}: {
  cents: number;
  confirmed: boolean;
  className?: string;
  size?: "md" | "lg";
}) {
  return (
    <span className={`inline-flex flex-wrap items-center gap-2 ${className}`}>
      <span className={`font-semibold tabular-nums ${size === "lg" ? "text-2xl" : "text-lg"}`}>{formatUSD(cents)}</span>
      {!confirmed && (
        <span className="rounded-full border border-[#c9a300] bg-notice px-2 py-0.5 text-xs font-semibold text-ink">
          Demo price
        </span>
      )}
    </span>
  );
}
