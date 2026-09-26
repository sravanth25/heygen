import Link from "next/link";
import { getProducts } from "@/config/products";
import { getFaq } from "@/config/faq";
import { brand } from "@/config/site";
import { ProductCard } from "@/components/product/ProductCard";
import { ComparisonTable } from "@/components/product/ComparisonTable";
import { JarSvg, accentBg } from "@/components/product/ProductVisual";
import { FlavorTag } from "@/components/product/FlavorTag";
import { HeroVisual } from "@/components/home/HeroVisual";
import { FaqList } from "@/components/home/FaqList";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ArrowIcon, InfoIcon } from "@/components/ui/icons";

export default function HomePage() {
  const products = getProducts();
  const [creatine, hydration] = products;

  return (
    <>
      {/* B. Hero */}
      <section aria-labelledby="hero-title" className="border-b border-line">
        <div className="container-page grid items-center gap-8 py-8 md:grid-cols-[1fr_1.05fr] md:gap-12 md:py-16 lg:py-20">
          <div>
            <p className="eyebrow mb-3 md:mb-4">Creatine &amp; hydration powders</p>
            <h1 id="hero-title" className="text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-7xl">
              {brand.tagline}
            </h1>
            <p className="mt-4 max-w-md text-lg text-muted md:mt-6 md:text-xl">
              Explore creatine and hydration powders for your training routine.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row md:mt-8">
              <Link href="/shop" className="btn btn-primary sm:px-7">
                Shop Formora
              </Link>
              <Link href="/#compare" className="btn btn-secondary sm:px-7">
                Compare the powders
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted md:mt-8">
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-citrus ring-1 ring-ink/20" aria-hidden="true" />
                {creatine.shortName} · {creatine.flavor}
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-peach ring-1 ring-ink/20" aria-hidden="true" />
                {hydration.shortName} · {hydration.flavor}
              </li>
            </ul>
          </div>
          <HeroVisual lead={creatine} second={hydration} />
        </div>
      </section>

      {/* C. Product range */}
      <section aria-labelledby="range-title" className="py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            id="range-title"
            eyebrow="The range"
            title="Meet the Formora range"
            intro="Two powders, each with a clear job. Pick the one that fits your routine."
          />
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* D. Comparison */}
      <section id="compare" aria-labelledby="compare-title" className="border-y border-line bg-white py-16 md:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.7fr] lg:gap-14">
          <div>
            <SectionHeading
              id="compare-title"
              eyebrow="Compare"
              title="Which powder fits?"
              intro={
                <>
                  <p>
                    <strong className="font-semibold text-ink">Creatine + Hydration</strong> is for people who want creatine
                    and electrolytes in one small daily glass.
                  </p>
                  <p className="mt-3">
                    <strong className="font-semibold text-ink">Hydration</strong> has no creatine. It is an electrolyte and
                    B-vitamin mix for a large bottle of water.
                  </p>
                </>
              }
            />
            <div className="flex gap-3 rounded-xl bg-warm p-4 text-[0.95rem]">
              <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-evergreen" />
              <p>
                These are alternatives — we don&apos;t suggest taking both. Neither is right for everyone: if you are pregnant,
                nursing, managing a health condition, or watching your sodium, check with your healthcare professional first.
              </p>
            </div>
          </div>
          <div>
            <ComparisonTable products={products} />
            <p className="mt-3 text-sm text-muted">
              A dash (—) means the value hasn&apos;t been verified yet, so we don&apos;t show it.
            </p>
          </div>
        </div>
      </section>

      {/* E. Ingredient transparency */}
      <section aria-labelledby="ingredients-title" className="py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            id="ingredients-title"
            eyebrow="Ingredients"
            title="Everything in the jar, in plain view"
            intro="Full ingredient lists, including sweeteners and flavorings, for each powder."
          />
          <div className="grid gap-6 md:grid-cols-2">
            {products.map((p) => (
              <article key={p.id} className="card p-6 sm:p-8">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <h3 className="text-xl">{p.shortName}</h3>
                  <FlavorTag accent={p.accent} flavor={p.flavor} />
                </div>
                <h4 className="mb-2 font-sans text-sm font-semibold tracking-normal text-muted">Active ingredients</h4>
                <ul className="mb-5 space-y-1.5">
                  {p.supplementFacts.rows.map((r) => (
                    <li key={r.nutrient} className="flex justify-between gap-4 border-b border-dashed border-line pb-1.5">
                      <span>{r.nutrient}</span>
                      {r.amount && <span className="shrink-0 font-semibold tabular-nums">{r.amount}</span>}
                    </li>
                  ))}
                </ul>
                <h4 className="mb-2 font-sans text-sm font-semibold tracking-normal text-muted">Other ingredients</h4>
                <p className="mb-5">{p.otherIngredients.value?.join(", ")}</p>
                <p className="rounded-lg bg-warm px-3 py-2 text-[0.95rem]">
                  <strong className="font-semibold">Sweetened with:</strong> {p.facts.sweetener.value}.{" "}
                  <strong className="font-semibold">Flavoring:</strong> {p.facts.flavoring.value}.
                </p>
                <Link href={`/products/${p.slug}#details`} className="link mt-5 inline-flex min-h-11 items-center gap-1">
                  Full product details <ArrowIcon className="h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            Ingredient details come from our supplier&apos;s product listing and are pending verification against the final
            label. <Link href="/ingredients" className="link">How we check product information</Link>
          </p>
        </div>
      </section>

      {/* F. Routine */}
      <section id="routine" aria-labelledby="routine-title" className="border-y border-line bg-white py-16 md:py-24">
        <div className="container-page">
          <SectionHeading
            id="routine-title"
            eyebrow="How to mix"
            title="One scoop, the right amount of water"
            intro="Each powder has its own directions. Follow the label on your jar."
          />
          <div className="grid gap-6 md:grid-cols-2">
            {products.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-[var(--radius-card)] border border-line">
                <div className={`relative aspect-[16/9] ${accentBg(p.accent)}`}>
                  <JarSvg product={p} view="glass" title={`Mixing placeholder for ${p.title}`} className="absolute inset-0 m-auto h-[88%] w-auto" />
                  <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-muted">
                    Placeholder — mixing photo or video coming
                  </span>
                </div>
                <div className="p-6 sm:p-8">
                  <h3 className="mb-4 text-xl">
                    {p.shortName} <span className="font-sans text-base font-normal text-muted">· {p.flavor}</span>
                  </h3>
                  <ol className="space-y-3">
                    {p.directions.value?.map((step, i) => (
                      <li key={step} className="flex gap-3">
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-bold text-ink ${p.accent === "citrus" ? "bg-citrus" : "bg-peach"}`}
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* G. FAQ */}
      <section aria-labelledby="faq-title" className="py-16 md:py-24">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-14">
          <SectionHeading
            id="faq-title"
            eyebrow="FAQ"
            title="Good questions"
            intro={
              <>
                Something else? <Link href="/contact" className="link">Contact us</Link>.
              </>
            }
          />
          <FaqList items={getFaq()} />
        </div>
      </section>

      {/* H. Final CTA */}
      <section aria-labelledby="cta-title" className="on-dark bg-evergreen text-white">
        <div className="container-page flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <div>
            <h2 id="cta-title" className="text-3xl sm:text-4xl">
              Pick your powder.
            </h2>
            <p className="mt-3 max-w-lg text-lg text-white/80">Two clear options, one-time purchase, shipped within the US.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/shop" className="btn btn-citrus sm:px-8">
              Shop Formora
            </Link>
            <Link href="/#compare" className="btn border-[1.5px] border-white/70 text-white hover:bg-white/10">
              Compare the powders
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
