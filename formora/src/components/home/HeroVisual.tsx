import type { Product } from "@/config/products";
import { JarSvg } from "@/components/product/ProductVisual";

export function HeroVisual({ lead, second }: { lead: Product; second: Product }) {
  return (
    <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[18px] bg-[#e9ecdf]">
      <div className="absolute inset-x-0 bottom-0 h-[22%] bg-[#dfe3d3]" aria-hidden="true" />
      <JarSvg
        product={second}
        title={`${second.title}, ${second.flavor} — preview render`}
        className="absolute right-[4%] bottom-[8%] h-[68%] w-auto"
      />
      <JarSvg
        product={lead}
        title={`${lead.title}, ${lead.flavor} — preview render`}
        className="absolute bottom-[3%] left-[5%] h-[92%] w-auto"
      />
      <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-muted">Preview render</span>
    </div>
  );
}
