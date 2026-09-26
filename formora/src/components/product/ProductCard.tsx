import Link from "next/link";
import { pricePerServingCents, type Product } from "@/config/products";
import { ProductMedia, displayTitle } from "./ProductVisual";
import { FlavorTag } from "./FlavorTag";
import { QuickAdd } from "./QuickAdd";
import { Price } from "@/components/ui/Price";
import { formatUSD } from "@/lib/money";

export function ProductCard({ product, headingLevel = "h3" }: { product: Product; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  const pps = pricePerServingCents(product);
  const href = `/products/${product.slug}`;
  return (
    <article className="card flex flex-col overflow-hidden">
      <Link href={href} className="block" aria-label={`${product.title}, ${product.flavor} — view details`}>
        <ProductMedia product={product} className="rounded-none" sizes="(min-width: 768px) 50vw, 100vw" />
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <FlavorTag accent={product.accent} flavor={product.flavor} />
          {product.facts.netWeight.value && <span className="text-sm text-muted">{product.facts.netWeight.value}</span>}
          {product.facts.servingsPerContainer.value && (
            <span className="text-sm text-muted">· {product.facts.servingsPerContainer.value} servings</span>
          )}
        </div>
        <H className="text-2xl sm:text-[1.7rem]">
          <Link href={href} className="hover:underline">
            {displayTitle(product.title)}
          </Link>
        </H>
        <p className="text-muted">{product.descriptor}</p>
        <div className="mt-auto space-y-4 pt-2">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Price cents={product.price.amountCents} confirmed={product.price.confirmed} />
            {pps !== null && <span className="text-sm text-muted">{formatUSD(pps)} per serving</span>}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <QuickAdd productId={product.id} title={product.title} available={product.available} />
            <Link href={href} className="btn btn-secondary">
              View details<span className="sr-only"> for {product.title}</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
