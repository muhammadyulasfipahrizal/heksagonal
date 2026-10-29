// *********************
// Role of the component: Quantity input for incrementing and decrementing product quantity on the single product page
// Name of the component: QuantityInput.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <QuantityInput quantityCount={quantityCount} setQuantityCount={setQuantityCount} />
// Input parameters: QuantityInputProps interface
// Output: one number input and two buttons
// *********************

"use client";

import React from "react";
import { FaPlus } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa6";

interface QuantityInputProps {
  quantityCount: number;
  setQuantityCount: React.Dispatch<React.SetStateAction<number>>;
}

const QuantityInput = ({quantityCount, setQuantityCount} : QuantityInputProps) => {


  const handleQuantityChange = (actionName: string): void => {
    if (actionName === "plus") {
      setQuantityCount(quantityCount + 1);
    } else if (actionName === "minus" && quantityCount !== 1) {
      setQuantityCount(quantityCount - 1);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <p className="text-sm font-medium text-gray-700 sm:text-base">
        Jumlah produk
      </p>

      <div className="inline-flex w-fit items-center overflow-hidden rounded-lg border border-gray-300 bg-white">
        <button
          type="button"
          aria-label="Kurangi jumlah produk"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => handleQuantityChange("minus")}
        >
          <FaMinus aria-hidden="true" className="text-xs" />
        </button>

        <input
          type="number"
          id="Quantity"
          aria-label="Jumlah produk"
          disabled
          value={quantityCount}
          className="h-11 w-14 border-x border-y-0 border-gray-300 bg-white p-0 text-center text-sm font-semibold text-gray-900 disabled:opacity-100 sm:w-16"
        />

        <button
          type="button"
          aria-label="Tambah jumlah produk"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-gray-600 transition hover:bg-gray-100"
          onClick={() => handleQuantityChange("plus")}
        >
          <FaPlus aria-hidden="true" className="text-xs" />
        </button>
      </div>
    </div>
  );
};

export default QuantityInput;
