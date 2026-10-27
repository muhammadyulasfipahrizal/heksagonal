
"use client";

import { ProductInCart, useProductStore } from "@/app/_zustand/store";
import { FaPlus, FaMinus } from "react-icons/fa6";

const QuantityInputCart = ({
  product,
}: {
  product: ProductInCart;
}) => {
  const updateCartAmount = useProductStore(
    (state) => state.updateCartAmount
  );

  const handleQuantityChange = (action: "plus" | "minus") => {
    const nextQuantity =
      action === "plus"
        ? product.amount + 1
        : Math.max(1, product.amount - 1);

    updateCartAmount(product.id, nextQuantity);
  };

  return (
    <div>
      <label htmlFor={`quantity-${product.id}`} className="sr-only">
        Quantity
      </label>

      <div className="flex w-32 items-center justify-center rounded border border-gray-200">
        <button
          type="button"
          aria-label="Kurangi kuantitas"
          disabled={product.amount <= 1}
          className="flex size-10 items-center justify-center text-gray-600 transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => handleQuantityChange("minus")}
        >
          <FaMinus />
        </button>

        <input
          type="number"
          id={`quantity-${product.id}`}
          readOnly
          min={1}
          value={product.amount}
          className="h-10 w-16 border-transparent text-center [-moz-appearance:_textfield] sm:text-sm [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
        />

        <button
          type="button"
          aria-label="Tambah kuantitas"
          className="flex size-10 items-center justify-center text-gray-600 transition hover:opacity-75"
          onClick={() => handleQuantityChange("plus")}
        >
          <FaPlus />
        </button>
      </div>
    </div>
  );
};

export default QuantityInputCart;
