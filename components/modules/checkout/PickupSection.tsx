"use client";

import CheckoutNotice from "@/components/modules/checkout/CheckoutNotice";
import PickupStoreSelector, {
  type PickupStoreId,
} from "@/components/PickupStoreSelector";
import type { CheckoutFormData } from "@/components/ContactForm";
import type { Dispatch, SetStateAction } from "react";
import CheckoutActionButton from "./CheckoutActionButton";
import type { DeliveryMethod } from "./types";

type PickupSectionProps = {
  isLoggedIn: boolean;
  checkoutForm: CheckoutFormData;
  setCheckoutForm: Dispatch<SetStateAction<CheckoutFormData>>;
  selectedStoreId: PickupStoreId | "";
  setSelectedStoreId: (storeId: PickupStoreId | "") => void;
  isSubmitting: boolean;

  // Props untuk tombol checkout
  deliveryMethod: DeliveryMethod;
  hasSelectedAddress: boolean;
  onPurchase: () => void;
  onRegister: () => void;
};

export default function PickupSection({
  isLoggedIn,
  checkoutForm,
  setCheckoutForm,
  selectedStoreId,
  setSelectedStoreId,
  isSubmitting,
  deliveryMethod,
  hasSelectedAddress,
  onPurchase,
  onRegister,
}: PickupSectionProps) {
  const updateField = (
    field: keyof CheckoutFormData,
    value: string,
  ) => {
    setCheckoutForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <section
      aria-label="Informasi pengambilan pesanan"
      className="order-2 min-w-0 px-3 sm:px-6 lg:order-1 lg:col-start-1 lg:row-start-1 lg:px-0"
    >
      {!isLoggedIn && (
        <CheckoutNotice
          title="Pengambilan Pesanan di Toko"
          description="Silakan ambil pesanan Anda secara langsung di toko kami. Dengan memilih metode pengambilan di toko, Anda tidak perlu menunggu pengiriman ke alamat tujuan."
          variant="pickup"
          className="mt-8 hidden lg:block"
        />
      )}

      <div className="mx-auto max-w-lg lg:max-w-none">
        {!isLoggedIn && (
          <div className="space-y-6">
            <div>
              <label
                htmlFor="name-input"
                className="block text-sm font-medium text-gray-700"
              >
                Nama
              </label>
              <input
                id="name-input"
                name="name"
                type="text"
                autoComplete="name"
                required
                disabled={isSubmitting}
                value={checkoutForm.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="phone-input"
                className="block text-sm font-medium text-gray-700"
              >
                Nomor Telepon
              </label>
              <input
                id="phone-input"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                disabled={isSubmitting}
                value={checkoutForm.phone}
                onChange={(event) =>
                  updateField("phone", event.target.value)
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="email-address"
                className="block text-sm font-medium text-gray-700"
              >
                Alamat Email
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isSubmitting}
                value={checkoutForm.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="order-notice"
                className="block text-sm font-medium text-gray-700"
              >
                Catatan
              </label>
              <textarea
                id="order-notice"
                name="orderNotice"
                disabled={isSubmitting}
                value={checkoutForm.orderNotice}
                onChange={(event) =>
                  updateField("orderNotice", event.target.value)
                }
                placeholder="Tambahkan catatan pesanan jika diperlukan"
                rows={4}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>
          </div>
        )}

        <div
          className={
            isLoggedIn
              ? "overflow-hidden rounded-2xl bg-white shadow-sm"
              : "mt-8"
          }
        >
          {isLoggedIn && <div className="h-1 bg-[#02054b]" />}

          <PickupStoreSelector
            selectedStoreId={selectedStoreId}
            onSelect={setSelectedStoreId}
          />
        </div>

        {/* Tombol checkout khusus mobile */}
        <CheckoutActionButton
          deliveryMethod={deliveryMethod}
          isLoggedIn={isLoggedIn}
          isSubmitting={isSubmitting}
          hasSelectedAddress={hasSelectedAddress}
          onPurchase={onPurchase}
          onRegister={onRegister}
          className="mt-6 block lg:hidden"
        />
      </div>
    </section>
  );
}