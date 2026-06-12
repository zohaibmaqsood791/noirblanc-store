import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cart } from "@/types";

interface CartStore {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  setCart: (cart: Cart | null) => void;
  openCart: () => void;
  closeCart: () => void;
  setLoading: (loading: boolean) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      cart: null,
      isOpen: false,
      isLoading: false,
      setCart: (cart) => set({ cart }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "noirblanc-cart",
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
