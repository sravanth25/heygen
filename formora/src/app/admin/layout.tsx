import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/lib/server/admin-auth";
import { isPreview } from "@/lib/readiness";
import { logout } from "./actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | FORMORA Admin" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/outbox", label: "Email outbox" },
  { href: "/admin/products", label: "Products & SKUs" },
  { href: "/admin/launch", label: "Launch checklist" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  return (
    <div className="flex min-h-dvh flex-col bg-[#f1f2ec]">
      <header className="on-dark bg-evergreen-900 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="font-display text-lg font-semibold tracking-[0.12em]">FORMORA</span>
            <span className="rounded bg-white/10 px-2 py-0.5 text-sm">Admin</span>
            {isPreview() && <span className="rounded bg-citrus px-2 py-0.5 text-xs font-semibold text-ink">Prototype · preview data</span>}
          </div>
          {admin && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-white/70">{admin.email}</span>
              <form action={logout}>
                <button type="submit" className="min-h-11 rounded-md px-3 hover:bg-white/10">
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
        {admin && (
          <nav aria-label="Admin" className="mx-auto max-w-7xl overflow-x-auto px-3">
            <ul className="flex gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="inline-flex min-h-11 items-center rounded-t-md px-3 text-sm whitespace-nowrap text-white/85 hover:bg-white/10 hover:text-white">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-5 py-8">
        {children}
      </main>
    </div>
  );
}
