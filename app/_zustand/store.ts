
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ProductInCart = {
  id: string;
  productId: string;
  variantId: string | null;
  title: string;
  variantTitle: string | null;
  price: number;
  image: string;
  amount: number;
};

type CartData = Pick<State, "products" | "allQuantity" | "total">;

export type State = {
  products: ProductInCart[];
  allQuantity: number;
  total: number;
};

export type Actions = {
  addToCart: (newProduct: ProductInCart) => void;
  removeFromCart: (id: string) => void;
  updateCartAmount: (id: string, quantity: number) => void;
  calculateTotals: () => void;
  clearCart: () => void;
};

const calculateCart = (products: ProductInCart[]) => ({
  allQuantity: products.reduce((sum, item) => sum + item.amount, 0),
  total: products.reduce(
    (sum, item) => sum + item.amount * item.price,
    0
  ),
});

export const useProductStore = create<State & Actions>()(
  persist(
    (set) => ({
      products: [],
      allQuantity: 0,
      total: 0,

      addToCart: (newProduct) => {
        set((state) => {
          const existingItem = state.products.find(
            (item) => item.id === newProduct.id
          );

          const products = existingItem
            ? state.products.map((item) =>
                item.id === newProduct.id
                  ? { ...item, amount: item.amount + newProduct.amount }
                  : item
              )
            : [...state.products, newProduct];

          return { products, ...calculateCart(products) };
        });
      },

      removeFromCart: (id) => {
        set((state) => {
          const products = state.products.filter((item) => item.id !== id);
          return { products, ...calculateCart(products) };
        });
      },

      updateCartAmount: (id, quantity) => {
        set((state) => {
          const products = state.products.map((item) =>
            item.id === id
              ? { ...item, amount: Math.max(1, quantity) }
              : item
          );

          return { products, ...calculateCart(products) };
        });
      },

      calculateTotals: () => {
        set((state) => calculateCart(state.products));
      },

      clearCart: () => {
        set({ products: [], allQuantity: 0, total: 0 });
      },
    }),
    {
      name: "products-storage",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
