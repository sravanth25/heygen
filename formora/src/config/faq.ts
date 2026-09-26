import { shipping, returns } from "@/config/shipping";
import { processingText, transitText } from "@/lib/shipping-copy";
import { formatUSD } from "@/lib/money";

export type FaqItem = { id: string; q: string; a: string; link?: { href: string; label: string } };

export function getFaq(): FaqItem[] {
  return [
    {
      id: "difference",
      q: "What is the difference between the two powders?",
      a: "Creatine + Hydration (Lemon) lists 5 g of creatine monohydrate and 1,000 mg of sodium per 10 g scoop, sweetened with stevia. Hydration (Peach Mango) contains no creatine; it is an electrolyte and B-vitamin powder sweetened with sucralose, with natural and artificial flavors. They are alternatives — we don't suggest taking both.",
      link: { href: "/#compare", label: "See the full comparison" },
    },
    {
      id: "ingredients",
      q: "What ingredients and sweeteners are included?",
      a: "Creatine + Hydration uses stevia leaf extract and natural flavors. Hydration uses sucralose and natural and artificial flavors. Not every FORMORA product is free of artificial sweeteners or flavors, so check each ingredient list.",
      link: { href: "/ingredients", label: "Read full ingredient lists" },
    },
    {
      id: "prepare",
      q: "How do I prepare each product?",
      a: "Creatine + Hydration: one scoop (10 g) in 6–8 fl oz of water, once daily. Hydration: one scoop in 14–20 fl oz of water, to taste, and no more than 5 scoops in 24 hours. Always follow the label on your jar.",
      link: { href: "/#routine", label: "Mixing instructions" },
    },
    {
      id: "where",
      q: "Where do you ship?",
      a: `We currently ship to addresses in ${shipping.destinationLabel}. We don't ship internationally.`,
    },
    {
      id: "timing",
      q: "How long do processing and delivery take?",
      a: `Processing (preparing and dispatching your order) takes ${processingText()}. Delivery then takes ${transitText()}. Shipping is a flat ${formatUSD(shipping.flatRateCents)} per order. These are estimates, not guarantees.`,
      link: { href: "/shipping-returns", label: "Shipping details" },
    },
    {
      id: "returns",
      q: "How do returns and damaged orders work?",
      a:
        returns.windowDays === null
          ? "Our return policy is being finalized before launch. If an order arrives damaged or incorrect, contact us with your order number and a photo and we'll make it right."
          : `You can request a return within ${returns.windowDays} days of delivery. If an order arrives damaged, contact us with photos.`,
      link: { href: "/shipping-returns", label: "Returns policy" },
    },
    {
      id: "track",
      q: "How do I track my order?",
      a: "Your confirmation email includes a secure order-status link. Once your order ships, we'll email the carrier and tracking number. You can also request the link again with your order number and email.",
      link: { href: "/track", label: "Track an order" },
    },
  ];
}
