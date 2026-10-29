
"use client";

import { useProductStore } from "@/app/_zustand/store";
import toast from "react-hot-toast";

type SelectedVariant = {
  id: string;
  title: string | null;
  price: number;
  image: string | null;
};

type Props = {
  product: {
    id: string;
    title: string;
    price: number;
    mainImage: string;
  };
  quantityCount: number;
  selectedVariant: SelectedVariant | null;
};

const AddToCartSingleProductBtn = ({
  product,
  quantityCount,
  selectedVariant,
}: Props) => {
  const addToCart = useProductStore((state) => state.addToCart);

  const handleAddToCart = () => {
    if (!selectedVariant) {
      toast.error("Silakan pilih varian produk terlebih dahulu.");
      return;
    }

    const cartItemId = `${product.id}:${selectedVariant.id}`;

    addToCart({
      id: cartItemId,
      productId: product.id,
      variantId: selectedVariant.id,
      title: product.title,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      image: selectedVariant.image || product.mainImage,
      amount: quantityCount,
    });

    toast.success("Product added to the cart");
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="
        btn min-h-12 h-auto w-full min-w-0 rounded-lg
        border border-gray-300 bg-white px-4 py-3
        text-sm font-semibold uppercase leading-tight
        text-[#02054b] shadow-none
        transition-colors duration-200
        hover:border-[#02054b] hover:bg-[#02054b] hover:text-white
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[#02054b] focus-visible:ring-offset-2
        sm:text-base
      "
    >
      Tambah Keranjang
    </button>
  );
};

export default AddToCartSingleProductBtn;
