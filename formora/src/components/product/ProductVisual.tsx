import Image from "next/image";
import type { Product, ProductAccent, ProductAsset } from "@/config/products";

/**
 * Preview renders stand in for product photography until authorized photos
 * exist. They show no Supplement Facts or label text beyond the product name.
 * To replace: add a `{ kind: "photo", src, ... }` asset in config/products.ts.
 */

const ACCENT: Record<ProductAccent, { band: string; soft: string; liquid: string }> = {
  citrus: { band: "#DDF272", soft: "#EEF6CF", liquid: "#EAF4A6" },
  peach: { band: "#F4B18A", soft: "#FBE3D3", liquid: "#F7C3A2" },
};

function Jar({ accent, name, flavor }: { accent: ProductAccent; name: string[]; flavor: string }) {
  const c = ACCENT[accent];
  return (
    <g>
      <ellipse cx="200" cy="436" rx="128" ry="14" fill="#17241E" opacity="0.10" />
      {/* lid */}
      <rect x="104" y="80" width="192" height="62" rx="12" fill="#102B25" />
      {Array.from({ length: 11 }).map((_, i) => (
        <rect key={i} x={116 + i * 16.5} y="88" width="3" height="46" rx="1.5" fill="#fff" opacity="0.06" />
      ))}
      {/* body */}
      <rect x="88" y="132" width="224" height="300" rx="28" fill="#183D35" />
      <rect x="104" y="146" width="12" height="272" rx="6" fill="#fff" opacity="0.07" />
      {/* wordmark */}
      <text
        x="200"
        y="206"
        textAnchor="middle"
        fill="#F7F7F2"
        style={{ font: "650 30px var(--font-display)", letterSpacing: "0.12em" }}
      >
        FORMORA
      </text>
      <rect x="176" y="222" width="48" height="2" rx="1" fill={c.band} />
      {/* band */}
      <rect x="88" y="252" width="224" height="118" fill={c.band} />
      {name.map((line, i) => (
        <text
          key={line}
          x="200"
          y={296 + i * 30}
          textAnchor="middle"
          fill="#17241E"
          style={{ font: "700 25px var(--font-display)", letterSpacing: "0.01em" }}
        >
          {line}
        </text>
      ))}
      <text
        x="200"
        y="404"
        textAnchor="middle"
        fill="#F7F7F2"
        style={{ font: "600 15px var(--font-sans)", letterSpacing: "0.16em" }}
      >
        {flavor.toUpperCase()}
      </text>
    </g>
  );
}

function nameLines(p: Pick<Product, "shortName">) {
  return p.shortName.includes("+") ? ["Creatine +", "Hydration"] : [p.shortName];
}

export function JarSvg({
  product,
  view = "front",
  className,
  title,
}: {
  product: Pick<Product, "accent" | "shortName" | "flavor">;
  view?: "front" | "glass";
  className?: string;
  title: string;
}) {
  const c = ACCENT[product.accent];
  if (view === "glass") {
    return (
      <svg viewBox="0 0 560 480" role="img" aria-label={title} className={className}>
        <g transform="translate(-10 20) scale(0.92)">
          <Jar accent={product.accent} name={nameLines(product)} flavor={product.flavor} />
        </g>
        {/* glass */}
        <ellipse cx="430" cy="440" rx="80" ry="10" fill="#17241E" opacity="0.08" />
        <path d="M362 200 L498 200 L484 430 Q483 440 473 440 L387 440 Q377 440 376 430 Z" fill="#fff" opacity="0.75" stroke="#B9C0B4" strokeWidth="2" />
        <path d="M368 262 L492 262 L484 428 Q483 434 476 434 L384 434 Q377 434 376 428 Z" fill={c.liquid} />
        <ellipse cx="430" cy="262" rx="62" ry="5" fill="#fff" opacity="0.6" />
        <rect x="380" y="214" width="6" height="200" rx="3" fill="#fff" opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 400 480" role="img" aria-label={title} className={className}>
      <Jar accent={product.accent} name={nameLines(product)} flavor={product.flavor} />
    </svg>
  );
}

export function accentBg(accent: ProductAccent) {
  return accent === "citrus" ? "bg-citrus-soft" : "bg-peach-soft";
}

export function ProductMedia({
  product,
  asset,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  showLabel = true,
  className = "",
  aspect = "aspect-square",
}: {
  aspect?: string;
  product: Product;
  asset?: ProductAsset;
  sizes?: string;
  priority?: boolean;
  showLabel?: boolean;
  className?: string;
}) {
  const a = asset ?? product.assets[0];
  return (
    <div className={`relative ${aspect} overflow-hidden rounded-[var(--radius-card)] ${accentBg(product.accent)} ${className}`}>
      {a.kind === "photo" ? (
        <Image src={a.src} alt={a.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      ) : (
        <JarSvg product={product} view={a.view} title={a.alt} className="absolute inset-0 m-auto h-[82%] w-[82%]" />
      )}
      {showLabel && a.kind === "render" && (
        <span className="absolute bottom-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-muted">
          Preview render
        </span>
      )}
    </div>
  );
}

/** Keep "Creatine + Hydration" together when titles wrap. */
export function displayTitle(title: string) {
  return title.replace(" + ", "\u00a0+\u00a0");
}
