import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/config/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ComparisonTable } from "@/components/product/ComparisonTable";
import { shippingSummary } from "@/lib/shipping-copy";

export const metadata: Metadata = {
  title: "Shop creatine and hydration powders",
  description: "Shop FORMORA Creatine + Hydration (Lemon) and FORMORA Hydration (Peach Mango). One-time purchase, US shipping.",
  alternates: { canonical: "/shop" },
};

export default function ShopPage() {
  const products = getProducts();
  const ship = shippingSummary();
  return (
    <div className="container-page py-12 md:py-16">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow mb-3">Shop</p>
        <h1 className="text-4xl sm:text-5xl">Find your fit</h1>
        <p className="mt-4 text-lg text-muted">
          Two powders. Creatine + Hydration if you want creatine with electrolytes; Hydration if you want an electrolyte drink
          without creatine. Choose one — they&apos;re alternatives.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} headingLevel="h2" />
        ))}
      </div>

      <p className="mt-6 text-muted">
        {ship.rate} within the US. {ship.processing}, {ship.transit}.{" "}
        <Link href="/shipping-returns" className="link">
          Shipping details
        </Link>
      </p>

      <section aria-labelledby="shop-compare" className="mt-16">
        <h2 id="shop-compare" className="mb-6 text-3xl">
          Side by side
        </h2>
        <ComparisonTable products={products} />
      </section>
    </div>
  );
}
