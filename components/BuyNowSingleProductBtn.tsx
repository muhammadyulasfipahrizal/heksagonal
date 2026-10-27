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
      onClick={handleAddToCart}
      className="btn w-[200px] border border-blue-500 bg-[#02054b] text-lg font-normal uppercase text-white transition-all ease-in hover:scale-110 hover:border-blue-500 hover:bg-white hover:text-[#02054b] max-[500px]:w-full"
    >
      Beli Sekarang
    </button>
  );
};

export default BuyNowSingleProductBtn;