import { ChevronIcon } from "./icons";

/** Native <details>/<summary>: keyboard and screen-reader accessible with no JS. */
export function AccordionItem({
  title,
  children,
  defaultOpen = false,
  id,
  headingLevel = "h3",
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  id?: string;
  headingLevel?: "h2" | "h3";
}) {
  const H = headingLevel;
  return (
    <details id={id} open={defaultOpen} className="group border-b border-line">
      <summary className="flex min-h-14 items-center justify-between gap-4 py-4 text-left">
        <H className="font-sans text-[1.05rem] font-semibold tracking-normal">{title}</H>
        <ChevronIcon className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-6 text-[0.975rem]">{children}</div>
    </details>
  );
}
