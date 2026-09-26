"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Modal } from "@/components/ui/Modal";
import { CartIcon, CloseIcon, MenuIcon } from "@/components/ui/icons";
import { Wordmark } from "./Wordmark";

type NavItem = { href: string; label: string };

export function CartButton() {
  const { count, hydrated, openDrawer } = useCart();
  const label = hydrated ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart";
  return (
    <button type="button" onClick={openDrawer} className="relative grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10" aria-label={label}>
      <CartIcon />
      {hydrated && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-citrus px-1 text-xs font-bold text-ink tabular-nums" aria-hidden="true">
          {count}
        </span>
      )}
    </button>
  );
}

export function DesktopNav({ items }: { items: readonly NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {items.map((i) => {
          const current = pathname === i.href || pathname.startsWith(`${i.href}/`);
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={current ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-lg px-3.5 text-[0.95rem] font-medium text-white/90 hover:bg-white/10 hover:text-white ${current ? "underline decoration-citrus decoration-2 underline-offset-8" : ""}`}
              >
                {i.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileMenu({ items, secondary }: { items: readonly NavItem[]; secondary: readonly NavItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="grid h-11 w-11 place-items-center rounded-full text-white hover:bg-white/10"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="mobile-menu-title"
        className="m-0 ml-auto h-dvh max-h-dvh w-[min(22rem,88vw)] max-w-none bg-warm p-0 text-ink"
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <h2 id="mobile-menu-title" className="sr-only">Menu</h2>
            <Wordmark className="text-evergreen" />
            <button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-white" aria-label="Close menu">
              <CloseIcon />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-4">
            <ul>
              {items.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-lg px-3 font-display text-xl font-semibold hover:bg-white">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-6 border-t border-line pt-4">
              {secondary.map((i) => (
                <li key={i.href}>
                  <Link href={i.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center rounded-lg px-3 text-muted hover:bg-white hover:text-ink">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-line p-5">
            <Link href="/shop" onClick={() => setOpen(false)} className="btn btn-primary w-full">
              Shop Formora
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  );
}
