
import { create } from "zustand";

type WishlistVariant = {
  id: string;
  title: string | null;
  price: number;
  image: string | null;
  isDefault: boolean;
};

type ProductInWishlist = {
  id: string;
  title: string;
  mainImage: string;
  slug: string;
  stockAvailabillity: number;
  variants: WishlistVariant[];
};

export type State = {
  wishlist: ProductInWishlist[];
  wishQuantity: number;
};

export type Actions = {
  addToWishlist: (product: ProductInWishlist) => void;
  removeFromWishlist: (id: string) => void;
  setWishlist: (wishlist: ProductInWishlist[]) => void;
};

export const useWishlistStore = create<State & Actions>((set) => ({
  wishlist: [],
  wishQuantity: 0,

  addToWishlist: (product) => {
    set((state) => {
      const exists = state.wishlist.some(
        (item) => item.id === product.id
      );

      if (exists) {
        return state;
      }

      const wishlist = [...state.wishlist, product];

      return {
        wishlist,
        wishQuantity: wishlist.length,
      };
    });
  },

  removeFromWishlist: (id) => {
    set((state) => {
      const wishlist = state.wishlist.filter(
        (item) => item.id !== id
      );

      return {
        wishlist,
        wishQuantity: wishlist.length,
      };
    });
  },

  setWishlist: (wishlist) => {
    set({
      wishlist: [...wishlist],
      wishQuantity: wishlist.length,
    });
  },
}));
