// *********************
// Role of the component: Cart icon and quantity that will be located in the header
// Name of the component: CartElement.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <CartElement />
// Input parameters: no input parameters
// Output: Cart icon and quantity
// *********************

"use client";
import Link from 'next/link'
import React from 'react'
import { FaCartShopping } from 'react-icons/fa6'
import { useProductStore } from "@/app/_zustand/store";

const CartElement = () => {
  const { allQuantity } = useProductStore();

  const quantity = Number(allQuantity) || 0;

  return (
    <Link
      href="/cart"
      aria-label={`Keranjang belanja, ${quantity} item`}
      title="Keranjang belanja"
      className="
        relative inline-flex h-11 w-11 shrink-0
        items-center justify-center rounded-full
        text-gray-800 transition-colors
        hover:bg-blue-50 hover:text-[#02054b]
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-blue-500
      "
    >
      <FaCartShopping
        aria-hidden="true"
        className="text-xl sm:text-2xl"
      />

      <span
        aria-hidden="true"
        className={`
          absolute right-0 top-0
          flex h-5 min-w-5 items-center justify-center
          rounded-full bg-[#01043D] px-1
          text-[10px] font-bold leading-none text-white
          ring-2 ring-white
          sm:h-6 sm:min-w-6 sm:text-xs
          ${quantity > 99 ? "text-[9px] sm:text-[10px]" : ""}
        `}
      >
        {quantity > 99 ? "99+" : quantity}
      </span>
    </Link>
  );
};

export default CartElement