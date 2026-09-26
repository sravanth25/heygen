import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import { getCatalog } from "@/lib/catalog";
import { shipping } from "@/config/shipping";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider catalog={getCatalog()}>
      <a href="#main" className="sr-only z-50 rounded-md bg-white px-4 py-3 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <PreviewBanner />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CartDrawer shippingCents={shipping.flatRateCents} />
      <ConsentBanner />
    </CartProvider>
  );
}
