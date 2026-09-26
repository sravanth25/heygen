import Link from "next/link";
import { pricePerServingCents, type Product } from "@/config/products";
import { formatUSD } from "@/lib/money";

type Row = { label: string; get: (p: Product) => string | null };

const rows: Row[] = [
  { label: "Creatine per serving", get: (p) => p.facts.creatinePerServing.value },
  { label: "Sodium per serving", get: (p) => p.facts.sodiumPerServing.value },
  { label: "Caffeine", get: (p) => p.facts.caffeine.value },
  { label: "Flavor", get: (p) => p.flavor },
  { label: "Sweetener", get: (p) => p.facts.sweetener.value },
  { label: "Flavoring", get: (p) => p.facts.flavoring.value },
  { label: "Serving size", get: (p) => p.facts.servingSize.value },
  { label: "Mix with", get: (p) => p.facts.mixWith.value },
  { label: "Net weight", get: (p) => p.facts.netWeight.value },
  { label: "Servings per jar", get: (p) => (p.facts.servingsPerContainer.value ? String(p.facts.servingsPerContainer.value) : null) },
  { label: "Price", get: (p) => `${formatUSD(p.price.amountCents)}${p.price.confirmed ? "" : " (demo)"}` },
  {
    label: "Price per serving",
    get: (p) => {
      const c = pricePerServingCents(p);
      return c === null ? null : `${formatUSD(c)}${p.price.confirmed ? "" : " (demo)"}`;
    },
  },
];

export function ComparisonTable({ products, caption = "Comparison of FORMORA powders" }: { products: Product[]; caption?: string }) {
  // Rows where no product has a known value are hidden entirely.
  const visible = rows.filter((r) => products.some((p) => r.get(p) !== null));
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[20rem] border-collapse text-left text-[0.9rem] sm:text-base">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line">
            <td className="w-[34%] p-3 sm:p-5" />
            {products.map((p) => (
              <th key={p.id} scope="col" className="p-3 align-bottom sm:p-5">
                <span className={`mb-2 block h-1.5 w-10 rounded-full ${p.accent === "citrus" ? "bg-citrus" : "bg-peach"}`} aria-hidden="true" />
                <Link href={`/products/${p.slug}`} className="font-display text-base leading-tight font-semibold hover:underline sm:text-xl">
                  {p.shortName}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.label} className="border-b border-line last:border-0">
              <th scope="row" className="p-3 align-top font-medium text-muted sm:p-5">
                {r.label}
              </th>
              {products.map((p) => {
                const v = r.get(p);
                return (
                  <td key={p.id} className="p-3 align-top sm:p-5">
                    {v ?? (
                      <>
                        <span aria-hidden="true" className="text-muted">
                          —
                        </span>
                        <span className="sr-only">Not yet verified</span>
                      </>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
