import Link from "next/link";
import type { FaqItem } from "@/config/faq";
import { AccordionItem } from "@/components/ui/Accordion";

export function FaqList({ items, headingLevel = "h3" }: { items: FaqItem[]; headingLevel?: "h2" | "h3" }) {
  return (
    <div className="border-t border-line">
      {items.map((f) => (
        <AccordionItem key={f.id} id={`faq-${f.id}`} title={f.q} headingLevel={headingLevel}>
          <p className="max-w-3xl">{f.a}</p>
          {f.link && (
            <p className="mt-3">
              <Link href={f.link.href} className="link">
                {f.link.label}
              </Link>
            </p>
          )}
        </AccordionItem>
      ))}
    </div>
  );
}
