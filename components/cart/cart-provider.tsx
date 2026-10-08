"use client";
import * as React from "react";

/** Minimal client cart. Each pre-loved item is unique, so quantity is always 1. */
export interface CartLine {
  productId: string;
  slug: string;
  title: string;
  price: number;
  image: string;
}

interface CartCtx {
  items: CartLine[];
  count: number;
  add: (line: CartLine) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const Ctx = React.createContext<CartCtx | null>(null);
const KEY = "highlux.cart.v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartLine[]>([]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = React.useCallback((next: CartLine[]) => {
    setItems(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const value = React.useMemo<CartCtx>(
    () => ({
      items,
      count: items.length,
      add: (line) => persist([...items.filter((i) => i.productId !== line.productId), line]),
      remove: (id) => persist(items.filter((i) => i.productId !== id)),
      clear: () => persist([]),
    }),
    [items, persist],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
