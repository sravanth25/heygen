import Link from "next/link";
import { brand, business, footerNav, nav, supplementDisclaimer } from "@/config/site";
import { displayedPaymentMethods } from "@/config/commerce";
import { NewsletterDemo } from "./NewsletterDemo";
import { Wordmark } from "./Wordmark";

export function SiteFooter() {
  return (
    <footer className="on-dark mt-auto bg-evergreen-900 text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.3fr_1fr_1fr_1.4fr]">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-xs text-white/80">{brand.tagline}</p>
          <p className="text-sm text-white/65">Shipping to the United States only.</p>
        </div>
        <nav aria-label="Shop">
          <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-white/60">Shop</h2>
          <ul className="space-y-1">
            {nav.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="inline-flex min-h-11 items-center text-white/90 hover:text-white hover:underline">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Help">
          <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-white/60">Help</h2>
          <ul className="space-y-1">
            {footerNav.map((i) => (
              <li key={i.href}>
                <Link href={i.href} className="inline-flex min-h-11 items-center text-white/90 hover:text-white hover:underline">
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <NewsletterDemo />
      </div>
      <div className="border-t border-white/10">
        <div className="container-page space-y-3 py-6 text-sm text-white/70">
          <p className="max-w-3xl">* {supplementDisclaimer}</p>
          {displayedPaymentMethods.length > 0 && <p>We accept: {displayedPaymentMethods.join(", ")}</p>}
          <p>
            © {new Date().getFullYear()} {business.legalName ?? "FORMORA (business name pending)"}. FORMORA is a provisional brand name.
          </p>
        </div>
      </div>
    </footer>
  );
}
