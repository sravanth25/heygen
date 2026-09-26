import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { getProducts } from "@/config/products";
import { isPreview } from "@/lib/readiness";

export default function sitemap(): MetadataRoute.Sitemap {
  // Nothing is submitted for indexing while the site is a preview.
  if (isPreview()) return [];
  const pages = ["", "/shop", "/ingredients", "/about", "/faq", "/contact", "/shipping-returns"];
  return [
    ...pages.map((p) => ({ url: `${siteUrl}${p}`, changeFrequency: "weekly" as const })),
    ...getProducts().map((p) => ({ url: `${siteUrl}/products/${p.slug}`, changeFrequency: "weekly" as const })),
  ];
}
