import type { ProductAccent } from "@/config/products";

export function FlavorTag({ accent, flavor }: { accent: ProductAccent; flavor: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold text-ink ${
        accent === "citrus" ? "bg-citrus" : "bg-peach"
      }`}
    >
      <span className="sr-only">Flavor: </span>
      {flavor}
    </span>
  );
}
