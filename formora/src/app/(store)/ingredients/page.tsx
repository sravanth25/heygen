import type { Metadata } from "next";
import Link from "next/link";
import { getProducts } from "@/config/products";
import { testingDocuments } from "@/config/commerce";
import { FlavorTag } from "@/components/product/FlavorTag";

export const metadata: Metadata = {
  title: "Ingredients and product transparency",
  description: "Full ingredient lists, sweeteners, flavorings, and where our product information comes from.",
  alternates: { canonical: "/ingredients" },
};

const STATUS_LABEL = {
  "label-verified": "Verified against label",
  "secondary-source": "From supplier listing — pending label check",
  derived: "Calculated — pending label check",
  unknown: "Not yet available",
} as const;

export default function IngredientsPage() {
  const products = getProducts();
  return (
    <div className="container-page py-12 md:py-16">
      <header className="max-w-2xl">
        <p className="eyebrow mb-3">Ingredients</p>
        <h1 className="text-4xl sm:text-5xl">What&apos;s in each jar</h1>
        <p className="mt-4 text-lg text-muted">
          Every ingredient, including sweeteners and flavorings. The two powders are different: one uses stevia and natural
          flavors, the other sucralose and natural and artificial flavors.
        </p>
      </header>

      <div className="mt-12 grid gap-8 lg:grid-cols-2">
        {products.map((p) => (
          <section key={p.id} aria-labelledby={`ing-${p.id}`} className="card p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id={`ing-${p.id}`} className="text-2xl">
                {p.title}
              </h2>
              <FlavorTag accent={p.accent} flavor={p.flavor} />
            </div>

            <h3 className="mt-6 mb-2 font-sans text-base font-semibold tracking-normal">Per serving ({p.facts.servingSize.value})</h3>
            <table className="w-full text-left">
              <caption className="sr-only">Active ingredients per serving in {p.title}</caption>
              <tbody>
                {p.supplementFacts.rows.map((r) => (
                  <tr key={r.nutrient} className="border-b border-line">
                    <th scope="row" className="py-2 pr-3 font-normal">
                      {r.nutrient}
                    </th>
                    <td className="py-2 text-right font-semibold tabular-nums">
                      {r.amount ?? <span className="text-sm font-normal text-muted">Amount pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="mt-6 mb-2 font-sans text-base font-semibold tracking-normal">Other ingredients</h3>
            <p>{p.otherIngredients.value?.join(", ")}</p>

            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl bg-warm p-4 text-[0.95rem]">
              <dt className="font-semibold">Sweetener</dt>
              <dd>{p.facts.sweetener.value}</dd>
              <dt className="font-semibold">Flavoring</dt>
              <dd>{p.facts.flavoring.value}</dd>
              <dt className="font-semibold">Caffeine</dt>
              <dd>{p.facts.caffeine.value}</dd>
              <dt className="font-semibold">Allergens</dt>
              <dd>{p.allergens.value ?? p.allergens.note}</dd>
            </dl>

            <p className="mt-4 text-sm text-muted">
              Status: {STATUS_LABEL[p.supplementFacts.status]} · Last checked {p.verification.lastChecked}
            </p>
            <Link href={`/products/${p.slug}#details`} className="link mt-3 inline-flex min-h-11 items-center">
              Full product details
            </Link>
          </section>
        ))}
      </div>

      <section aria-labelledby="how-title" className="prose-formora mt-16 max-w-3xl">
        <h2 id="how-title">How we handle product information</h2>
        <p>
          FORMORA products are made and shipped by our fulfillment partner. We don&apos;t manufacture products ourselves, and our
          formulas are not exclusive to FORMORA.
        </p>
        <ul>
          <li>We publish ingredient and serving information from our partner&apos;s product specifications.</li>
          <li>Before launch, every fact is checked against the physical label. Until then, it is marked as pending.</li>
          <li>If a value isn&apos;t verified, we leave it out rather than estimate it.</li>
          <li>We don&apos;t claim clinical results for our products, and we don&apos;t carry certifications we can&apos;t show you.</li>
        </ul>
        {testingDocuments.length > 0 && (
          <>
            <h3>Testing documents</h3>
            <ul>
              {testingDocuments.map((d) => (
                <li key={d.url}>
                  <a href={d.url}>{d.label}</a> ({d.date})
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
