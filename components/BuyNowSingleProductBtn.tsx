"use client";

import { useProductStore } from "@/app/_zustand/store";
import React from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

type SelectedVariant = {
  id: string;
  title: string | null;
  price: number;
  image: string | null;
};

type BuyNowSingleProductBtnProps = {
  product: Product;
  quantityCount: number;
  selectedVariant?: SelectedVariant | null;
};

const BuyNowSingleProductBtn = ({
  product,
  quantityCount,
  selectedVariant = null,
}: BuyNowSingleProductBtnProps) => {
  const router = useRouter();
  const { addToCart, calculateTotals } = useProductStore();

  const handleAddToCart = () => {
    const price = selectedVariant?.price ?? product.price ?? 0;

    addToCart({
      id: selectedVariant
        ? `${product.id}:${selectedVariant.id}`
        : product.id.toString(),
      productId: product.id.toString(),
      variantId: selectedVariant?.id ?? null,
      variantTitle: selectedVariant?.title ?? null,
      title: product.title,
      price,
      image: selectedVariant?.image || product.mainImage,
      amount: quantityCount,
    });

    calculateTotals();
    toast.success("Product added to the cart");
    router.push("/checkout");
  };

  return (
    <button
      type="button"
      onClick={handleAddToCart}
      className="
        btn min-h-12 h-auto w-full min-w-0 rounded-lg
        border border-[#02054b] bg-[#02054b] px-4 py-3
        text-sm font-semibold uppercase leading-tight
        text-white shadow-none
        transition-colors duration-200
        hover:border-[#02054b] hover:bg-white hover:text-[#02054b]
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-[#02054b] focus-visible:ring-offset-2
        sm:text-base
      "
    >
      Beli Sekarang
    </button>
  );
};

export default BuyNowSingleProductBtn;