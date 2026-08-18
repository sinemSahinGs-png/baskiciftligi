"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CartInputLine } from "@/domain/commerce/cart-pricing";

interface CartState {
  lines: CartInputLine[];
  hasHydrated: boolean;
  addLine: (line: CartInputLine) => void;
  setQuantity: (
    productId: string,
    variantId: string | null | undefined,
    quantity: number,
  ) => void;
  removeLine: (
    productId: string,
    variantId?: string | null,
  ) => void;
  clear: () => void;
  setHasHydrated: (value: boolean) => void;
}

function sameLine(
  line: CartInputLine,
  productId: string,
  variantId?: string | null,
) {
  if (line.quoteId) {
    return line.productId === productId;
  }
  return (
    line.productId === productId &&
    (line.variantId ?? null) === (variantId ?? null)
  );
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      hasHydrated: false,
      addLine: (newLine) =>
        set((state) => {
          const existing = state.lines.find((line) =>
            sameLine(line, newLine.productId, newLine.variantId),
          );

          if (!existing) {
            return {
              lines: [
                ...state.lines,
                {
                  ...newLine,
                  quantity: Math.max(1, Math.min(99, newLine.quantity)),
                },
              ],
            };
          }

          if (newLine.quoteId) {
            return state;
          }

          return {
            lines: state.lines.map((line) =>
              sameLine(line, newLine.productId, newLine.variantId)
                ? {
                    ...line,
                    quantity: Math.min(99, line.quantity + newLine.quantity),
                  }
                : line,
            ),
          };
        }),
      setQuantity: (productId, variantId, quantity) =>
        set((state) => ({
          lines:
            quantity < 1
              ? state.lines.filter(
                  (line) => !sameLine(line, productId, variantId),
                )
              : state.lines.map((line) =>
                  sameLine(line, productId, variantId)
                    ? { ...line, quantity: Math.min(99, quantity) }
                    : line,
                ),
        })),
      removeLine: (productId, variantId) =>
        set((state) => ({
          lines: state.lines.filter(
            (line) => !sameLine(line, productId, variantId),
          ),
        })),
      clear: () => set({ lines: [] }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "octo-studio-cart-v1",
      partialize: (state) => ({ lines: state.lines }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function selectCartCount(state: CartState) {
  return state.lines.reduce((count, line) => count + line.quantity, 0);
}
