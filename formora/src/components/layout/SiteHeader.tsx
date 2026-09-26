import Link from "next/link";
import { footerNav, nav } from "@/config/site";
import { CartButton, DesktopNav, MobileMenu } from "./HeaderClient";
import { Wordmark } from "./Wordmark";

export function SiteHeader() {
  return (
    <header className="on-dark sticky top-0 z-40 bg-evergreen text-white">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          <MobileMenu items={nav} secondary={footerNav} />
          <Link href="/" className="inline-flex min-h-11 items-center rounded-md px-1" aria-label="FORMORA home">
            <Wordmark />
          </Link>
        </div>
        <DesktopNav items={nav} />
        <CartButton />
      </div>
    </header>
  );
}
