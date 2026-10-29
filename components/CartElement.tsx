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
        relative inline-flex size-10 shrink-0
        items-center justify-center rounded-xl
        text-gray-600 transition-colors duration-200
        hover:bg-blue-50 hover:text-[#02054b]
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-blue-500
      "
    >
      <FaCartShopping
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
        {quantity > 99 ? "99+" : quantity}
      </span>
    </Link>
  );
};

export default CartElement