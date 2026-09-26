"use client";

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from "react";
import type { CatalogItem } from "@/lib/catalog";
import { track } from "@/lib/analytics";

export type CartLine = { productId: string; quantity: number };
export type ResolvedLine = CartLine & { item: CatalogItem };

const STORAGE_KEY = "formora-cart-v1";
export const MAX_QTY = 10;

type CartContextValue = {
  catalog: CatalogItem[];
  lines: ResolvedLine[];
  count: number;
  subtotalCents: number;
  hydrated: boolean;
  hasUnavailable: boolean;
  add: (productId: string, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  announcement: string;
};

const CartContext = createContext<CartContextValue | null>(null);

// Browser-side cart store (product IDs + quantities only), read through
// useSyncExternalStore so every tab and component stays in sync.
let memoryFallback = "[]";
const listeners = new Set<() => void>();
function readStore(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return memoryFallback;
  }
}
function writeStore(value: string) {
  memoryFallback = value;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* storage unavailable (private mode) — cart still works for this visit */
  }
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function sanitize(raw: unknown, catalog: CatalogItem[]): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const ids = new Set(catalog.map((c) => c.id));
  const out = new Map<string, number>();
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const { productId, quantity } = r as Record<string, unknown>;
    if (typeof productId !== "string" || !ids.has(productId)) continue;
    const q = Math.floor(Number(quantity));
    if (!Number.isFinite(q) || q < 1) continue;
    out.set(productId, Math.min(MAX_QTY, (out.get(productId) ?? 0) + q));
  }
  return [...out].map(([productId, quantity]) => ({ productId, quantity }));
}

export function CartProvider({ catalog, children }: { catalog: CatalogItem[]; children: React.ReactNode }) {
  // null on the server and during hydration; the stored JSON afterwards.
  const stored = useSyncExternalStore(subscribe, readStore, () => null);
  const hydrated = stored !== null;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const raw = useMemo(() => {
    try {
      return sanitize(JSON.parse(stored ?? "[]"), catalog);
    } catch {
      return [];
    }
  }, [stored, catalog]);

  const persist = useCallback((next: CartLine[]) => writeStore(JSON.stringify(next)), []);

  const lines = useMemo(
    () =>
      raw.flatMap((l) => {
        const item = catalog.find((c) => c.id === l.productId);
        return item ? [{ ...l, item }] : [];
      }),
    [raw, catalog],
  );

  const add = useCallback(
    (productId: string, quantity: number) => {
      const item = catalog.find((c) => c.id === productId);
      if (!item || !item.available) return;
      const current = raw.find((l) => l.productId === productId)?.quantity ?? 0;
      const nextQty = Math.min(MAX_QTY, current + quantity);
      const next = current
        ? raw.map((l) => (l.productId === productId ? { ...l, quantity: nextQty } : l))
        : [...raw, { productId, quantity: nextQty }];
      persist(next);
      track({ name: "add_to_cart", productId, quantity, valueCents: item.priceCents * quantity });
      setAnnouncement(
        nextQty === MAX_QTY && current + quantity > MAX_QTY
          ? `Cart limit reached: ${MAX_QTY} of ${item.title}.`
          : `Added ${quantity} × ${item.title} to your cart.`,
      );
      setDrawerOpen(true);
    },
    [catalog, raw, persist],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const q = Math.max(1, Math.min(MAX_QTY, Math.floor(quantity)));
      persist(raw.map((l) => (l.productId === productId ? { ...l, quantity: q } : l)));
      setAnnouncement(`Quantity updated to ${q}.`);
    },
    [raw, persist],
  );

  const remove = useCallback(
    (productId: string) => {
      const item = catalog.find((c) => c.id === productId);
      persist(raw.filter((l) => l.productId !== productId));
      setAnnouncement(`Removed ${item?.title ?? "item"} from your cart.`);
    },
    [catalog, raw, persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value: CartContextValue = {
    catalog,
    lines,
    count: lines.reduce((n, l) => n + l.quantity, 0),
    subtotalCents: lines.reduce((n, l) => n + l.item.priceCents * l.quantity, 0),
    hydrated,
    hasUnavailable: lines.some((l) => !l.item.available),
    add,
    setQuantity,
    remove,
    clear,
    drawerOpen,
    openDrawer: () => setDrawerOpen(true),
    closeDrawer: () => setDrawerOpen(false),
    announcement,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <div aria-live="polite" role="status" className="sr-only">
        {announcement}
      </div>
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
