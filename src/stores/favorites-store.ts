"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoritesState {
  productIds: string[];
  modelIds: string[];
  hasHydrated: boolean;
  toggle: (productId: string) => void;
  toggleModel: (modelId: string) => void;
  remove: (productId: string) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set) => ({
      productIds: [],
      modelIds: [],
      hasHydrated: false,
      toggle: (productId) =>
        set((state) => ({
          productIds: state.productIds.includes(productId)
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        })),
      toggleModel: (modelId) =>
        set((state) => ({
          modelIds: state.modelIds.includes(modelId)
            ? state.modelIds.filter((id) => id !== modelId)
            : [...state.modelIds, modelId],
        })),
      remove: (productId) =>
        set((state) => ({
          productIds: state.productIds.filter((id) => id !== productId),
        })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "octo-studio-favorites-v1",
      partialize: (state) => ({
        productIds: state.productIds,
        modelIds: state.modelIds,
      }),
      merge: (persisted, current) => {
        const stored =
          persisted && typeof persisted === "object"
            ? (persisted as Partial<FavoritesState>)
            : {};

        return {
          ...current,
          ...stored,
          productIds: stored.productIds ?? [],
          modelIds: stored.modelIds ?? [],
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
