import Link from "next/link";
import { getCheckoutMode, isPreview } from "@/lib/readiness";

export function PreviewBanner() {
  const mode = getCheckoutMode();
  if (!isPreview() && mode !== "disabled") return null;
  return (
    <div className="border-b border-[#e3cf7a] bg-notice text-ink">
      <p className="container-page py-2 text-center text-sm">
        {mode === "disabled" ? (
          <>Checkout is not open yet. Launch requirements are still outstanding.</>
        ) : (
          <>
            <strong className="font-semibold">Design preview.</strong>{" "}
            <span className="sm:hidden">Demo prices, {mode === "stripe-test" ? "test-mode" : "simulated"} checkout. </span>
            <span className="hidden sm:inline">
              Prices are illustrative, product details are pending label verification, and checkout is{" "}
              {mode === "stripe-test" ? "in payment test mode" : "simulated"} — no real orders or payments.{" "}
            </span>
            <Link href="/about#preview" className="link">
              What this means
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
