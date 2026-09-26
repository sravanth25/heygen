import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts, isProductFullyVerified, pricePerServingCents, type Product } from "@/config/products";
import { siteUrl, supplementDisclaimer } from "@/config/site";
import { displayTitle } from "@/components/product/ProductVisual";
import { Gallery } from "@/components/product/Gallery";
import { PurchaseControls } from "@/components/product/PurchaseControls";
import { FlavorTag } from "@/components/product/FlavorTag";
import { ProductCard } from "@/components/product/ProductCard";
import { ComparisonTable } from "@/components/product/ComparisonTable";
import { Price } from "@/components/ui/Price";
import { AccordionItem } from "@/components/ui/Accordion";
import { InfoIcon, ReturnIcon, TruckIcon } from "@/components/ui/icons";
import { formatUSD } from "@/lib/money";
import { isPreview } from "@/lib/readiness";
import { shipping } from "@/config/shipping";
import { returnsSummary, shippingSummary } from "@/lib/shipping-copy";

export function generateStaticParams() {
  return getProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = getProduct(slug);
  if (!p) return {};
  return {
    title: `${p.title} — ${p.flavor}`,
    description: p.descriptor,
    alternates: { canonical: `/products/${p.slug}` },
  };
}

/** Structured data only from confirmed, label-verified data. No ratings. */
function productJsonLd(p: Product) {
  if (isPreview() || !p.price.confirmed || !isProductFullyVerified(p)) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${p.title} — ${p.flavor}`,
    sku: p.sku,
    description: p.descriptor,
    brand: { "@type": "Brand", name: "FORMORA" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${p.slug}`,
      priceCurrency: "USD",
      price: (p.price.amountCents / 100).toFixed(2),
      availability: p.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
}

function NotVerified({ children = "Pending label verification" }: { children?: React.ReactNode }) {
  return <p className="text-sm text-muted italic">{children}</p>;
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) notFound();

  const others = getProducts().filter((p) => p.id !== product.id);
  const f = product.facts;
  const pps = pricePerServingCents(product);
  const ship = shippingSummary();
  const jsonLd = productJsonLd(product);

  const titleBlock = (
    <>
      <FlavorTag accent={product.accent} flavor={product.flavor} />
      <h1 className="mt-3 text-[2rem] leading-tight sm:text-[2.6rem]">{displayTitle(product.title)}</h1>
    </>
  );

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      <div className="container-page pt-5 pb-14 md:pt-8">
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/shop" className="inline-flex min-h-11 items-center hover:underline">
                Shop
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {product.shortName}
            </li>
          </ol>
        </nav>

        {/* Mobile: name before image */}
        <div className="mb-5 lg:hidden">{titleBlock}</div>

        <div className="grid gap-8 lg:grid-cols-[55fr_45fr] lg:gap-12">
          <Gallery product={product} />

          <section aria-label="Purchase" className="lg:sticky lg:top-24 lg:self-start">
            <div className="hidden lg:block">{titleBlock}</div>

            <p className="mt-4 text-lg text-muted lg:mt-5">{product.descriptor}</p>

            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[0.95rem]">
              {f.netWeight.value && (
                <div className="flex gap-1.5">
                  <dt className="text-muted">Size</dt>
                  <dd className="font-semibold">{f.netWeight.value}</dd>
                </div>
              )}
              {f.servingsPerContainer.value && (
                <div className="flex gap-1.5">
                  <dt className="text-muted">Servings</dt>
                  <dd className="font-semibold">{f.servingsPerContainer.value}</dd>
                </div>
              )}
              {f.servingSize.value && (
                <div className="flex gap-1.5">
                  <dt className="text-muted">Serving</dt>
                  <dd className="font-semibold">{f.servingSize.value}</dd>
                </div>
              )}
            </dl>

            <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-6">
              <Price cents={product.price.amountCents} confirmed={product.price.confirmed} size="lg" />
              {pps !== null && <span className="text-muted">{formatUSD(pps)} per serving</span>}
            </div>
            {!product.price.confirmed && <p className="mt-1 text-sm text-muted">{product.price.note}</p>}
            <p className="mt-1 text-sm text-muted">One-time purchase. No subscription.</p>

            <div className="mt-6">
              <PurchaseControls
                productId={product.id}
                title={product.title}
                flavor={product.flavor}
                priceCents={product.price.amountCents}
                priceConfirmed={product.price.confirmed}
                available={product.available}
              />
            </div>

            <ul className="mt-6 space-y-3 rounded-xl border border-line bg-white p-5 text-[0.95rem]">
              <li className="flex gap-3">
                <TruckIcon className="mt-0.5 h-5 w-5 shrink-0 text-evergreen" />
                <span>
                  <strong className="font-semibold">Ships within the US.</strong> {ship.rate}. {ship.processing}, {ship.transit}.
                  {!ship.verified && <span className="text-muted"> (Estimates pending confirmation.)</span>}
                </span>
              </li>
              <li className="flex gap-3">
                <ReturnIcon className="mt-0.5 h-5 w-5 shrink-0 text-evergreen" />
                <span>
                  {returnsSummary()}{" "}
                  <Link href="/shipping-returns" className="link">
                    Details
                  </Link>
                </span>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div id="details" className="border-t border-line bg-white">
        <div className="container-page grid gap-10 py-14 lg:grid-cols-[1fr_2fr] lg:gap-14 md:py-20">
          <div>
            <h2 className="text-3xl">Product details</h2>
            <div className="mt-5 flex gap-3 rounded-xl bg-warm p-4 text-sm">
              <InfoIcon className="h-5 w-5 shrink-0 text-evergreen" />
              <p>
                Details below come from our supplier&apos;s listing and are pending verification against the final label. Always
                read the label on your jar.
              </p>
            </div>
          </div>

          <div className="border-t border-line">
            <AccordionItem title="Overview" defaultOpen>
              <div className="max-w-2xl space-y-3">
                {product.overview.map((para) => (
                  <p key={para}>{para}</p>
                ))}
              </div>
            </AccordionItem>

            <AccordionItem title="Ingredients">
              <h4 className="mb-2 font-sans text-sm font-semibold tracking-normal text-muted">Active ingredients</h4>
              <ul className="mb-4 list-disc space-y-1 pl-5">
                {product.supplementFacts.rows.map((r) => (
                  <li key={r.nutrient}>{r.nutrient}</li>
                ))}
              </ul>
              <h4 className="mb-2 font-sans text-sm font-semibold tracking-normal text-muted">Other ingredients</h4>
              {product.otherIngredients.value ? <p>{product.otherIngredients.value.join(", ")}.</p> : <NotVerified />}
              <p className="mt-4">
                <strong className="font-semibold">Sweetener:</strong> {f.sweetener.value}. <strong className="font-semibold">Flavoring:</strong>{" "}
                {f.flavoring.value}. <strong className="font-semibold">Caffeine:</strong> {f.caffeine.value}.
              </p>
            </AccordionItem>

            <AccordionItem title="Supplement Facts" defaultOpen>
              <div className="max-w-xl overflow-hidden rounded-xl border-2 border-ink">
                <table className="w-full border-collapse text-left text-[0.95rem]">
                  <caption className="border-b-4 border-ink px-4 pt-3 pb-2 text-left font-display text-2xl font-bold">
                    Supplement Facts
                    <span className="block font-sans text-sm font-normal">
                      Serving size: {f.servingSize.value ?? "pending verification"}
                      {f.servingsPerContainer.value ? ` · Servings per container: ${f.servingsPerContainer.value}` : ""}
                    </span>
                  </caption>
                  <thead>
                    <tr className="border-b border-ink">
                      <th scope="col" className="px-4 py-2 font-semibold">
                        Nutrient
                      </th>
                      <th scope="col" className="px-4 py-2 text-right font-semibold">
                        Amount per serving
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.supplementFacts.rows.map((r) => (
                      <tr key={r.nutrient} className="border-b border-line last:border-0">
                        <th scope="row" className="px-4 py-2 font-normal">
                          {r.nutrient}
                        </th>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums">
                          {r.amount ?? (
                            <>
                              <span aria-hidden="true">—</span>
                              <span className="sr-only">Not yet verified</span>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-sm text-muted">
                Text version from the supplier listing. % Daily Values are shown on the product label.
                {product.supplementFacts.rows.some((r) => r.amount === null) &&
                  " Amounts marked — will be added once verified against the label."}{" "}
                A photo of the label will be added when final packaging is available.
              </p>
            </AccordionItem>

            <AccordionItem title="Directions">
              {product.directions.value ? (
                <ol className="list-decimal space-y-1.5 pl-5">
                  {product.directions.value.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ol>
              ) : (
                <NotVerified />
              )}
            </AccordionItem>

            <AccordionItem title="Warnings and allergens">
              <h4 className="mb-2 font-sans text-sm font-semibold tracking-normal text-muted">From the label</h4>
              {product.labelWarnings.value ? (
                <ul className="mb-4 list-disc space-y-1 pl-5">
                  {product.labelWarnings.value.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : (
                <NotVerified />
              )}
              <h4 className="mb-2 font-sans text-sm font-semibold tracking-normal text-muted">Allergens</h4>
              {product.allergens.value ? <p className="mb-4">{product.allergens.value}</p> : <NotVerified>{product.allergens.note}</NotVerified>}
              <h4 className="mt-4 mb-2 font-sans text-sm font-semibold tracking-normal text-muted">General guidance</h4>
              <p>
                Consult your healthcare professional before use if you are pregnant or nursing, take medication, or have a medical
                condition. Keep out of reach of children. We offer our powders as alternatives and don&apos;t suggest combining
                them.
              </p>
            </AccordionItem>

            <AccordionItem title="Shipping and returns">
              <ul className="list-disc space-y-1.5 pl-5">
                <li>Delivery to {shipping.destinationLabel} only.</li>
                <li>{ship.rate}.</li>
                <li>
                  {ship.processing}, {ship.transit}.{!ship.verified && " These estimates are pending confirmation."}
                </li>
                <li>{returnsSummary()}</li>
              </ul>
              <p className="mt-3">
                <Link href="/shipping-returns" className="link">
                  Full shipping and returns details
                </Link>
              </p>
            </AccordionItem>

            <AccordionItem title="Questions about this product">
              <dl className="space-y-4">
                {product.faq.map((q) => (
                  <div key={q.q}>
                    <dt className="font-semibold">{q.q}</dt>
                    <dd className="mt-1">{q.a}</dd>
                  </div>
                ))}
              </dl>
            </AccordionItem>

            <AccordionItem title="Sources and verification">
              <p className="mb-3">{product.verification.summary}</p>
              <p className="mb-2 text-sm text-muted">Last checked: {product.verification.lastChecked}</p>
              <ul className="list-disc pl-5">
                {product.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} className="link" rel="noopener noreferrer" target="_blank">
                      {s.label}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </AccordionItem>
            <p className="mt-6 text-sm text-muted">* {supplementDisclaimer}</p>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="other-title" className="container-page py-14 md:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">Compare another option</p>
              <h2 id="other-title" className="text-3xl">
                Not quite right?
              </h2>
            </div>
            <Link href="/#compare" className="link inline-flex min-h-11 items-center">
              Side-by-side comparison
            </Link>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
            {others.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            <ComparisonTable products={[product, ...others]} caption={`${product.shortName} compared with the other FORMORA powder`} />
          </div>
        </section>
      )}
    </>
  );
}
