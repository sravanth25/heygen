import { getProducts, pricePerServingCents, type ProductAccent } from "@/config/products";

/** The subset of product data the browser needs for the cart. */
export type CatalogItem = {
  id: string;
  slug: string;
  title: string;
  shortName: string;
  flavor: string;
  accent: ProductAccent;
  priceCents: number;
  priceConfirmed: boolean;
  available: boolean;
  netWeight: string | null;
  pricePerServingCents: number | null;
};

export function getCatalog(): CatalogItem[] {
  return getProducts().map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    shortName: p.shortName,
    flavor: p.flavor,
    accent: p.accent,
    priceCents: p.price.amountCents,
    priceConfirmed: p.price.confirmed,
    available: p.available,
    netWeight: p.facts.netWeight.value,
    pricePerServingCents: pricePerServingCents(p),
  }));
}
