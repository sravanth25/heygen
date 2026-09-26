import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/config/site";

export const metadata: Metadata = {
  title: "About Formora",
  description: "Why FORMORA keeps a small range with understandable ingredients.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="container-page py-12 md:py-16">
      <header className="max-w-3xl">
        <p className="eyebrow mb-3">Our story</p>
        <h1 className="text-4xl sm:text-5xl">{brand.tagline}</h1>
        <p className="mt-5 text-xl text-muted">
          FORMORA is a new brand for adults who train regularly and want a supplement routine that is easy to understand.
        </p>
      </header>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {[
          ["A small range, on purpose", "We start with two powders and only add products when there is a clear reason to."],
          ["Ingredients in plain view", "Full ingredient lists, sweeteners, and flavorings are on every product page — including the ones some people avoid."],
          ["Honest shopping", "No invented reviews, countdown timers, or fake discounts. Clear prices, clear shipping, one-time purchases."],
        ].map(([t, d]) => (
          <div key={t} className="card p-6">
            <h2 className="text-xl">{t}</h2>
            <p className="mt-3 text-muted">{d}</p>
          </div>
        ))}
      </div>

      <section className="prose-formora mt-16 max-w-3xl" aria-labelledby="how-we-work">
        <h2 id="how-we-work">How we work</h2>
        <p>
          We choose the products, set the standards for how they are presented, and look after you as a customer. Our products are
          made and shipped by a third-party supplement fulfillment partner — we don&apos;t run our own manufacturing facility.
        </p>
        <p>
          Questions about an order or a product? <Link href="/contact">Get in touch</Link>.
        </p>

        <h2 id="preview">About this preview</h2>
        <p>This site is a design preview of a store that hasn&apos;t launched. While it is in preview:</p>
        <ul>
          <li>Prices are illustrative samples, not launch prices.</li>
          <li>Product details come from our supplier&apos;s listing and are pending verification against final labels.</li>
          <li>Product images are preview renders, not photos of final packaging.</li>
          <li>Checkout is simulated. No payment is taken and nothing ships.</li>
          <li>The FORMORA name is provisional, pending domain and trademark checks.</li>
        </ul>
      </section>
    </div>
  );
}
