/**
 * Product facts, prices, assets, and supplier mappings.
 *
 * Every fact carries a verification status. Only "label-verified" facts may
 * be used for live commerce or structured data. Unknown values are `null` and
 * are hidden in the UI rather than guessed.
 */

export type VerificationStatus =
  /** Checked against the physical label / current supplier spec sheet. */
  | "label-verified"
  /** Taken from a copy of the supplier listing; not yet checked against the label. */
  | "secondary-source"
  /** Calculated from other facts (e.g. net weight ÷ serving size). */
  | "derived"
  /** Not available yet. */
  | "unknown";

export type Fact<T> = { value: T | null; status: VerificationStatus; note?: string };

export type FactRow = {
  nutrient: string;
  /** Amount per serving as printed on the label, or null if not yet verified. */
  amount: string | null;
};

export type ProductAsset =
  | {
      kind: "render";
      view: "front" | "glass";
      alt: string;
      /** Clearly labelled on-screen as a preview render. */
      label: string;
    }
  | {
      kind: "photo";
      src: string;
      width: number;
      height: number;
      alt: string;
      label: string;
    };

export type ProductAccent = "citrus" | "peach";

export type Product = {
  id: string;
  slug: string;
  sku: string;
  title: string;
  shortName: string;
  flavor: string;
  accent: ProductAccent;
  /** One-sentence descriptor used on cards. Must only restate label facts. */
  descriptor: string;
  overview: string[];
  price: { amountCents: number; confirmed: boolean; note: string };
  available: boolean;
  facts: {
    servingSize: Fact<string>;
    servingsPerContainer: Fact<number>;
    netWeight: Fact<string>;
    creatinePerServing: Fact<string>;
    sodiumPerServing: Fact<string>;
    caffeine: Fact<string>;
    sweetener: Fact<string>;
    flavoring: Fact<string>;
    mixWith: Fact<string>;
  };
  supplementFacts: { rows: FactRow[]; status: VerificationStatus };
  otherIngredients: Fact<string[]>;
  directions: Fact<string[]>;
  labelWarnings: Fact<string[]>;
  allergens: Fact<string>;
  faq: { q: string; a: string }[];
  assets: ProductAsset[];
  supplier: {
    name: "Supliful";
    productName: string;
    catalogUrl: string;
    /** Supplier-side flavor/variant as listed in their catalog. */
    variant: string;
  };
  sources: { label: string; url: string }[];
  verification: { lastChecked: string; summary: string };
};

const SECONDARY_NOTE =
  "From copies of the supplier listing. The supplier page could not be opened directly from the build environment. Confirm against the physical label.";

export const products: Product[] = [
  {
    id: "creatine-hydration-lemon",
    slug: "creatine-hydration-lemon",
    sku: "FRM-CRH-LEM",
    title: "FORMORA Creatine + Hydration",
    shortName: "Creatine + Hydration",
    flavor: "Lemon",
    accent: "citrus",
    descriptor:
      "5 g creatine monohydrate and 1,000 mg sodium per scoop, with potassium and magnesium. Lemon flavored, sweetened with stevia.",
    overview: [
      "Creatine + Hydration combines creatine monohydrate with sodium, potassium, and magnesium in a single lemon-flavored scoop.",
      "It is sweetened with stevia leaf extract and flavored with natural flavors. Each scoop is mixed with a small glass of water.",
      "With 1,000 mg of sodium per serving, it is a high-sodium product. If you watch your sodium intake, check with your healthcare professional first.",
    ],
    price: {
      amountCents: 3999,
      confirmed: false,
      note: "Illustrative sample price for the design preview. Not a validated launch price.",
    },
    available: true,
    facts: {
      servingSize: { value: "1 scoop (10 g)", status: "secondary-source" },
      servingsPerContainer: {
        value: 30,
        status: "derived",
        note: "300 g net weight ÷ 10 g scoop. Confirm the servings statement on the label.",
      },
      netWeight: { value: "300 g (10.6 oz)", status: "secondary-source" },
      creatinePerServing: { value: "5 g (creatine monohydrate)", status: "secondary-source" },
      sodiumPerServing: { value: "1,000 mg", status: "secondary-source" },
      caffeine: { value: "None listed", status: "secondary-source" },
      sweetener: { value: "Stevia leaf extract", status: "secondary-source" },
      flavoring: { value: "Natural flavors", status: "secondary-source" },
      mixWith: { value: "6–8 fl oz (177–237 mL) water", status: "secondary-source" },
    },
    supplementFacts: {
      status: "secondary-source",
      rows: [
        { nutrient: "Creatine (as creatine monohydrate)", amount: "5,000 mg" },
        { nutrient: "Magnesium (as magnesium malate)", amount: "60 mg" },
        { nutrient: "Sodium (as sea salt)", amount: "1,000 mg" },
        { nutrient: "Potassium (as potassium chloride)", amount: "200 mg" },
      ],
    },
    otherIngredients: {
      value: ["Natural flavors", "Stevia extract (leaf)", "Silicon dioxide"],
      status: "secondary-source",
    },
    directions: {
      value: [
        "Adults: add one scoop (10 g) to a glass or shaker.",
        "Mix with 6–8 fl oz (177–237 mL) of water or your preferred beverage.",
        "Take once daily.",
      ],
      status: "secondary-source",
    },
    labelWarnings: { value: ["Do not exceed recommended dose."], status: "secondary-source" },
    allergens: { value: null, status: "unknown", note: "Allergen statement pending label verification." },
    faq: [
      {
        q: "How much creatine is in a serving?",
        a: "Each 10 g scoop lists 5,000 mg (5 g) of creatine monohydrate.",
      },
      {
        q: "How much sodium does it contain?",
        a: "1,000 mg per scoop. That is a significant share of the sodium many adults eat in a day, so factor it into your diet and speak to a healthcare professional if you follow a sodium-restricted diet.",
      },
      {
        q: "Does it contain caffeine?",
        a: "Caffeine is not listed in the ingredients.",
      },
      {
        q: "Can I take it with FORMORA Hydration?",
        a: "We offer the two powders as alternatives, and we don't suggest combining them. Choose the one that fits your routine.",
      },
    ],
    assets: [
      {
        kind: "render",
        view: "front",
        alt: "Preview render of a FORMORA Creatine + Hydration jar with a lemon-yellow label band",
        label: "Preview render — final packaging photo pending",
      },
      {
        kind: "render",
        view: "glass",
        alt: "Preview render of the jar beside a glass of pale lemon drink",
        label: "Preview render — mixing photo pending",
      },
    ],
    supplier: {
      name: "Supliful",
      productName: "Creatine Hydration Powder",
      catalogUrl: "https://supliful.com/catalog/creatine-hydration-powder",
      variant: "Lemon",
    },
    sources: [
      { label: "Supliful catalog — Creatine Hydration Powder", url: "https://supliful.com/catalog/creatine-hydration-powder" },
    ],
    verification: { lastChecked: "2026-09-26", summary: SECONDARY_NOTE },
  },
  {
    id: "hydration-peach-mango",
    slug: "hydration-peach-mango",
    sku: "FRM-HYD-PMG",
    title: "FORMORA Hydration",
    shortName: "Hydration",
    flavor: "Peach Mango",
    accent: "peach",
    descriptor:
      "Electrolytes (sodium, potassium, calcium, magnesium) with B vitamins. Peach mango flavored, sweetened with sucralose. No creatine.",
    overview: [
      "Hydration is a peach mango electrolyte powder with sodium, potassium, calcium, and magnesium, plus a set of B vitamins.",
      "It is sweetened with sucralose and uses natural and artificial flavors. The supplier lists it as caffeine-free.",
      "It contains no creatine. One scoop is mixed into a large bottle of water.",
    ],
    price: {
      amountCents: 2999,
      confirmed: false,
      note: "Illustrative sample price for the design preview. Not a validated launch price.",
    },
    available: true,
    facts: {
      servingSize: { value: "1 scoop", status: "secondary-source", note: "Scoop weight pending label verification." },
      servingsPerContainer: { value: null, status: "unknown" },
      netWeight: { value: "164 g (5.78 oz)", status: "secondary-source" },
      creatinePerServing: { value: "None", status: "secondary-source" },
      sodiumPerServing: { value: null, status: "unknown" },
      caffeine: { value: "Caffeine-free (per supplier listing)", status: "secondary-source" },
      sweetener: { value: "Sucralose", status: "secondary-source" },
      flavoring: { value: "Natural and artificial flavors", status: "secondary-source" },
      mixWith: { value: "14–20 fl oz (414–591 mL) water", status: "secondary-source" },
    },
    supplementFacts: {
      status: "secondary-source",
      rows: [
        { nutrient: "Vitamin B1 (as thiamin)", amount: null },
        { nutrient: "Vitamin B2 (as riboflavin)", amount: null },
        { nutrient: "Vitamin B3 (as niacin)", amount: null },
        { nutrient: "Vitamin B6 (as pyridoxal 5′-phosphate)", amount: null },
        { nutrient: "Folate (vitamin B9)", amount: null },
        { nutrient: "Vitamin B12 (as methylcobalamin)", amount: null },
        { nutrient: "Calcium (as calcium citrate)", amount: null },
        { nutrient: "Magnesium (as magnesium citrate)", amount: null },
        { nutrient: "Sodium (as sodium citrate)", amount: null },
        { nutrient: "Potassium (as potassium citrate)", amount: null },
      ],
    },
    otherIngredients: {
      value: [
        "Polydextrose",
        "Citric acid",
        "Natural & artificial flavors",
        "Sucralose",
        "Calcium silicate",
        "Fruit & vegetable blend (for color)",
      ],
      status: "secondary-source",
    },
    directions: {
      value: [
        "Add one scoop to a bottle.",
        "Mix with 14–20 fl oz (414–591 mL) of water, to taste. For a larger bottle, use two scoops with 28–40 fl oz of water.",
        "Do not exceed 5 scoops in a 24-hour period.",
      ],
      status: "secondary-source",
    },
    labelWarnings: { value: ["Do not exceed 5 scoops in a 24-hour period."], status: "secondary-source" },
    allergens: { value: null, status: "unknown", note: "Allergen statement pending label verification." },
    faq: [
      {
        q: "What sweetens Hydration?",
        a: "Sucralose. It also contains natural and artificial flavors, so it is not an option if you avoid artificial sweeteners or flavors.",
      },
      {
        q: "Does it contain creatine?",
        a: "No. If you are looking for creatine, see Creatine + Hydration.",
      },
      {
        q: "How much water should I use?",
        a: "The supplier directions call for one scoop in 14–20 fl oz of water, adjusted to taste.",
      },
      {
        q: "Can I take it with FORMORA Creatine + Hydration?",
        a: "We offer the two powders as alternatives, and we don't suggest combining them. Choose the one that fits your routine.",
      },
    ],
    assets: [
      {
        kind: "render",
        view: "front",
        alt: "Preview render of a FORMORA Hydration jar with a peach-colored label band",
        label: "Preview render — final packaging photo pending",
      },
      {
        kind: "render",
        view: "glass",
        alt: "Preview render of the jar beside a glass of peach-colored drink",
        label: "Preview render — mixing photo pending",
      },
    ],
    supplier: {
      name: "Supliful",
      productName: "Hydration Powder (Peach Mango)",
      catalogUrl: "https://supliful.com/catalog/hydration-powder-peach-mango",
      variant: "Peach Mango",
    },
    sources: [
      { label: "Supliful catalog — Hydration Powder (Peach Mango)", url: "https://supliful.com/catalog/hydration-powder-peach-mango" },
    ],
    verification: { lastChecked: "2026-09-26", summary: SECONDARY_NOTE },
  },
];

/** Products can be marked unavailable at runtime without a code change. */
function unavailableIds(): Set<string> {
  return new Set(
    (process.env.FORMORA_UNAVAILABLE_PRODUCTS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

export function getProducts(): Product[] {
  const off = unavailableIds();
  return products.map((p) => (off.has(p.id) ? { ...p, available: false } : p));
}

export function getProduct(idOrSlug: string): Product | undefined {
  return getProducts().find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

export function isProductFullyVerified(p: Product): boolean {
  const facts = Object.values(p.facts).filter((f) => f.value !== null);
  return (
    facts.every((f) => f.status === "label-verified") &&
    p.supplementFacts.status === "label-verified" &&
    p.supplementFacts.rows.every((r) => r.amount !== null) &&
    p.otherIngredients.status === "label-verified" &&
    p.directions.status === "label-verified" &&
    p.labelWarnings.status === "label-verified" &&
    p.allergens.status === "label-verified"
  );
}

/** Price per serving, only when the servings count is known. */
export function pricePerServingCents(p: Product): number | null {
  const servings = p.facts.servingsPerContainer.value;
  if (!servings) return null;
  return Math.round(p.price.amountCents / servings);
}
