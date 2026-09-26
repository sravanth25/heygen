import type { Metadata, Viewport } from "next";
import "./globals.css";
import { brand, siteUrl } from "@/config/site";
import { isPreview } from "@/lib/readiness";

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: { default: `${brand.name} — ${brand.tagline}`, template: `%s | ${brand.name}` },
    description: brand.description,
    // The whole site stays out of search indexes while it is a preview.
    robots: isPreview() ? { index: false, follow: false } : undefined,
    openGraph: { siteName: brand.name, locale: "en_US", type: "website" },
  };
}

export const viewport: Viewport = {
  themeColor: "#183D35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
