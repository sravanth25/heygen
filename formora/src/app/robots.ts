import type { MetadataRoute } from "next";
import { siteUrl } from "@/config/site";
import { isPreview } from "@/lib/readiness";

export default function robots(): MetadataRoute.Robots {
  if (isPreview()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/cart", "/checkout", "/orders", "/track"] },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
