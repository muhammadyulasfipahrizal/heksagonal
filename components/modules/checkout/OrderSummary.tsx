"use client";

import Image from "next/image";
import { formatRupiah } from "@/lib/sanitize";
import { getImageSrc } from "@/lib/utils";
import type { DeliveryMethod } from "./types";
import CheckoutActionButton from "./CheckoutActionButton";

type CheckoutProduct = {
  id?: string;
  title?: string;
  image?: string | null;
  amount: number;
  price: number;
};

type OrderSummaryProps = {
  products: CheckoutProduct[];
  total: number;
  deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (method: DeliveryMethod) => void;
  isLoggedIn: boolean;
  isSubmitting: boolean;
  hasSelectedAddress: boolean;
  onPurchase: () => void;
  onRegister: () => void;
};

export default function OrderSummary({
  products,
  total,
  deliveryMethod,
  setDeliveryMethod,
  isLoggedIn,
  isSubmitting,
  hasSelectedAddress,
  onPurchase,
  onRegister,
}: OrderSummaryProps) {
  return (
    <section
      aria-labelledby="summary-heading"
      className="order-1 min-w-0 bg-gray-50 px-4 pb-8 pt-6 sm:px-6 lg:order-2 lg:col-start-2 lg:row-start-1 lg:bg-transparent lg:px-0 lg:pb-16 lg:pt-16"
    >
      <div className="mx-auto max-w-lg">
        <h2
          id="summary-heading"
          className="text-lg font-medium text-gray-900"
        >
          Ringkasan Order
        </h2>

        <ul className="divide-y divide-gray-200 text-sm font-medium text-gray-900">
          {products.map((product) => (
            <li
              key={product.id}
              className="flex items-start space-x-4 py-6"
            >
              <Image
                src={getImageSrc(
                  product.image || "/product_placeholder.jpg"
                )}
                alt={product.title || "Produk"}
                width={80}
                height={80}
                className="h-20 w-20 flex-none rounded-md object-cover object-center"
              />

              <div className="min-w-0 flex-auto space-y-1">
                <h3>{product.title}</h3>
                <p className="text-gray-500">x{product.amount}</p>
              </div>

              <p className="flex-none text-base font-medium">
                {formatRupiah(product.price)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="hidden space-y-6 border-t border-gray-200 pt-6 text-sm font-medium text-gray-900 lg:block">
          <div className="flex items-center justify-between">
            <dt className="text-gray-600">Subtotal</dt>
            <dd>{formatRupiah(total)}</dd>
          </div>

          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <dt className="text-base">Total</dt>
            <dd className="text-base">{formatRupiah(total)}</dd>
          </div>
        </dl>

        <div className="mt-2 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Metode Pemesanan
          </h3>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
              deliveryMethod === "pickup"
                ? "border-[#02054b] bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <input
              type="radio"
              name="deliveryMethod"
              value="pickup"
              checked={deliveryMethod === "pickup"}
              onChange={() => setDeliveryMethod("pickup")}
              className="mt-1 accent-[#02054b]"
            />

            <span>
              <span className="block font-medium text-gray-900">
                Pickup Toko
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                Ambil pesanan langsung di toko. Tidak perlu mengisi formulir
                alamat.
              </span>
            </span>
          </label>

          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
              deliveryMethod === "shipping"
                ? "border-[#02054b] bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <input
              type="radio"
              name="deliveryMethod"
              value="shipping"
              checked={deliveryMethod === "shipping"}
              onChange={() => setDeliveryMethod("shipping")}
              className="mt-1 accent-[#02054b]"
            />

            <span>
              <span className="block font-medium text-gray-900">
                Kirim ke Alamat
              </span>
              <span className="mt-1 block text-sm text-gray-500">
                Pesanan dikirim ke alamat penerima. Informasi kontak dan alamat
                wajib diisi.
              </span>
            </span>
          </label>

          <CheckoutActionButton
                deliveryMethod={deliveryMethod}
                isLoggedIn={isLoggedIn}
                isSubmitting={isSubmitting}
                hasSelectedAddress={hasSelectedAddress}
                onPurchase={onPurchase}
                onRegister={onRegister}
                className="hidden lg:block"
            />
        </div>
      </div>
    </section>
  );
}