"use client";

import type { DeliveryMethod } from "./types";

type CheckoutActionButtonProps = {
  deliveryMethod: DeliveryMethod;
  isLoggedIn: boolean;
  isSubmitting: boolean;
  hasSelectedAddress: boolean;
  onPurchase: () => void;
  onRegister: () => void;
  className?: string;
};

export default function CheckoutActionButton({
  deliveryMethod,
  isLoggedIn,
  isSubmitting,
  hasSelectedAddress,
  onPurchase,
  onRegister,
  className = "",
}: CheckoutActionButtonProps) {
  const isShipping = deliveryMethod === "shipping";

  const isDisabled =
    isSubmitting || (isShipping && isLoggedIn && !hasSelectedAddress);

  const buttonLabel = isSubmitting
    ? "Memproses Pesanan..."
    : isShipping && isLoggedIn && !hasSelectedAddress
      ? "Pilih Alamat Pengiriman"
      : isShipping && !isLoggedIn
        ? "Registrasi Sekarang"
        : "Buat Pesanan";

  const handleClick = () => {
    if (isShipping && !isLoggedIn) {
      onRegister();
      return;
    }

    onPurchase();
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={handleClick}
      className={`w-full rounded-md bg-[#02054b] px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {buttonLabel}
    </button>
  );
}