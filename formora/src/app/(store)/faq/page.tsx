import type { Metadata } from "next";
import Link from "next/link";
import { getFaq } from "@/config/faq";
import { getProducts } from "@/config/products";
import { FaqList } from "@/components/home/FaqList";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about FORMORA products, ingredients, preparation, shipping, returns, and order tracking.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <div className="container-page max-w-4xl py-12 md:py-16">
      <p className="eyebrow mb-3">FAQ</p>
      <h1 className="mb-10 text-4xl sm:text-5xl">Frequently asked questions</h1>
      <h2 className="mb-4 text-2xl">Shopping and orders</h2>
      <FaqList items={getFaq()} />
      {getProducts().map((p) => (
        <section key={p.id} className="mt-12">
          <h2 className="mb-4 text-2xl">
            {p.shortName} · {p.flavor}
          </h2>
          <FaqList items={p.faq.map((f, i) => ({ id: `${p.id}-${i}`, q: f.q, a: f.a }))} />
        </section>
      ))}
      <p className="mt-12 text-muted">
        Still have a question? <Link href="/contact" className="link">Contact us</Link>.
      </p>
    </div>
  );
}
