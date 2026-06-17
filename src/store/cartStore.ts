import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cart } from "@/types";

interface CartStore {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  /** variationId → imageUrl, persisted so cart images survive refresh */
  variantImages: Record<number, string>;
  setCart: (cart: Cart | null) => void;
  openCart: () => void;
  closeCart: () => void;
  setLoading: (loading: boolean) => void;
  setVariantImage: (variationId: number, imageUrl: string) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: null,
      isOpen: false,
      isLoading: false,
      variantImages: {},
      setCart: (cart) => set({ cart }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setVariantImage: (variationId, imageUrl) =>
        set((s) => ({ variantImages: { ...s.variantImages, [variationId]: imageUrl } })),
    }),
    {
      name: "noirblanc-cart",
      partialize: (state) => ({ cart: state.cart, variantImages: state.variantImages }),
    }
  )
);
