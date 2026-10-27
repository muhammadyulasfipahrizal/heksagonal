
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
      className="btn w-[250px] text-lg border border-gray-300 font-normal bg-white text-[#02054b] hover:bg-[#02054b] hover:text-white hover:border-blue-500 hover:scale-110 transition-all uppercase ease-in max-[500px]:w-full"
    >
      Tambah Keranjang
    </button>
  );
};

export default AddToCartSingleProductBtn;
