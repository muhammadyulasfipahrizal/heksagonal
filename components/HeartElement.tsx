// *********************
// Role of the component: Wishlist icon with quantity located in the header
// Name of the component: HeartElement.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <HeartElement />
// Input parameters: no input parameters
// Output: wishlist icon with quantity
// *********************

"use client";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import Link from "next/link";
import React from "react";
import { FaHeart } from "react-icons/fa6";

const HeartElement = ({
  wishQuantity,
}: {
  wishQuantity: number;
}) => {
  return (
    <Link
      href="/wishlist"
      aria-label={`Wishlist, ${wishQuantity} item`}
      title="Wishlist"
      className="
        relative inline-flex size-10 shrink-0
        items-center justify-center rounded-xl
        text-gray-600 transition-colors duration-200
        hover:bg-blue-50 hover:text-[#02054b]
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-blue-500
      "
    >
      <FaHeart
        aria-hidden="true"
        className="size-5"
      />

      <span
        aria-hidden="true"
        className="
          absolute right-0.5 top-0.5
          flex h-[17px] min-w-[17px] items-center justify-center
          rounded-full bg-[#01043D] px-1
          text-[9px] font-bold leading-none text-white
          ring-2 ring-white
        "
      >
        {wishQuantity > 99 ? "99+" : wishQuantity}
      </span>
    </Link>
  );
};

export default HeartElement;
