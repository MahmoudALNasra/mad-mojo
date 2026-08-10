"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "./types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productId: string, size: string | null) => void;
  setQty: (productId: string, size: string | null, qty: number) => void;
  clear: () => void;
}

export const FREE_SHIPPING_THRESHOLD_CENTS = 15000;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      add: (item, qty = 1) =>
        set((state) => {
          const idx = state.items.findIndex(
            (i) => i.productId === item.productId && i.size === item.size
          );
          if (idx >= 0) {
            const items = [...state.items];
            items[idx] = { ...items[idx], qty: items[idx].qty + qty };
            return { items, isOpen: true };
          }
          return { items: [...state.items, { ...item, qty }], isOpen: true };
        }),
      remove: (productId, size) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.size === size)
          ),
        })),
      setQty: (productId, size, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter(
                  (i) => !(i.productId === productId && i.size === size)
                )
              : state.items.map((i) =>
                  i.productId === productId && i.size === size
                    ? { ...i, qty }
                    : i
                ),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "madmojo-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export function cartSubtotalCents(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.priceCents * i.qty, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
