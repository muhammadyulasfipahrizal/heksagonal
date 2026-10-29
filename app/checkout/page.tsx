"use client";
import { SectionTitle } from "@/components";
import { useProductStore } from "../_zustand/store";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { CheckoutFormData  } from "@/components/ContactForm";

import PickupStoreSelector, {
  type PickupStoreId,
  PICKUP_STORES,
} from "@/components/PickupStoreSelector";
import { getImageSrc } from "@/lib/utils";

import OrderSummary from "@/components/modules/checkout/OrderSummary";
import CheckoutAddressSection from "@/components/modules/checkout/CheckoutAddressSection";
import CheckoutNotice from "@/components/modules/checkout/CheckoutNotice";
import type {
  CheckoutAddress,
  DeliveryMethod,
} from "@/components/modules/checkout/types";

import PickupSection from "@/components/modules/checkout/PickupSection";
import CheckoutActionButton from "@/components/modules/checkout/CheckoutActionButton";


interface SavedAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  adress: string;
  postalCode: string;
  city: string;
  province: string;
  district: string;
  isDefault: boolean;
}

const CheckoutPage = () => {
  const { data: session, status: sessionStatus } = useSession();

  const [savedAddresses, setSavedAddresses] =
  useState<SavedAddress[]>([]);

  const [selectedStoreId, setSelectedStoreId] =
    useState<PickupStoreId | "">("");

  const [selectedAddressId, setSelectedAddressId] =
    useState("");

  const [isCreatingAddress, setIsCreatingAddress] =
    useState(false);

  const [selectedAddress, setSelectedAddress] =
    useState<CheckoutAddress | null>(null);

  const isLoggedIn = sessionStatus === "authenticated";
  const isSessionLoading = sessionStatus === "loading";

  useEffect(() => {
    if (session?.user?.email) {
      setCheckoutForm((current) => ({
        ...current,
        email: session?.user?.email ?? current.email,
      }));
    }
  }, [session?.user?.email]);

  const [checkoutForm, setCheckoutForm] =
    useState<CheckoutFormData>({
      name: "",
      phone: "",
      email: "",
      district: "",
      adress: "",
      province: "",
      city: "",
      postalCode: "",
      orderNotice: "",
    });

  const handleSelectAddress = useCallback(
    (address: CheckoutAddress) => {
      setSelectedAddress(address);
      setSelectedAddressId(address.id);

      console.log("Selected address:", session?.user?.email );

      setCheckoutForm((current) => ({
        ...current,
        name: address.recipientName,
        phone: address.phone,
        email: session?.user?.email ?? current.email,
        adress: address.adress,
        postalCode: address.postalCode,
        city: address.city,
        province: address.province,
        district: address.district,
      }));
    },
    [session?.user?.email]
  );
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { products, total, clearCart } = useProductStore();
  const router = useRouter();

  // delivery method
  type DeliveryMethod = "pickup" | "shipping";

  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>("pickup");

  const [isContactModalOpen, setIsContactModalOpen] =
    useState(false);

  const validateContactForm = () => {
    const errors: string[] = [];

    if (checkoutForm.name.trim().length < 2) {
      errors.push("Nama minimal 2 karakter");
    }

    const phoneDigits = checkoutForm.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      errors.push("Nomor telepon minimal 10 digit");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(checkoutForm.email.trim())) {
      errors.push("Masukkan alamat email yang valid");
    }

    return errors;
  };

  const validateShippingForm = () => {
    const errors: string[] = [];

    const requiredFields = [
      ["adress", "Alamat"],
      ["postalCode", "Kode pos"],
      ["city", "Kota"],
      ["province", "Provinsi"],
      ["district", "Kecamatan"],
    ] as const;

    for (const [field, label] of requiredFields) {
      const value = checkoutForm[field];

      if (!value?.trim()) {
        errors.push(`${label} wajib diisi`);
      }
    }

    return errors;
  };

  const makePurchase = async () => {
    if (isSubmitting) return;

    if (products.length === 0) {
      toast.error("Keranjang belanja kosong.");
      return;
    }

    if (!Number.isFinite(total) || total <= 0) {
      toast.error("Total pesanan tidak valid.");
      return;
    }

    const isAuthenticated = sessionStatus === "authenticated";
    const accountEmail = session?.user?.email?.trim().toLowerCase() ?? "";

    let userId: string | null = null;
    let userPhone = "";

    if (isAuthenticated) {
      userId = session?.user?.id ?? null;

      if (!userId && session?.user?.email) {
        const userResponse = await apiClient.get(
          `/api/users/email/${encodeURIComponent(session.user.email)}`
        );

        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData.id ?? null;
        }
      }

      if (!userId) {
        toast.error("Identitas akun tidak ditemukan. Silakan login kembali.");
        return;
      }

      // Khusus pickup: ambil nomor telepon dari tabel User.
      if (deliveryMethod === "pickup") {
        const userResponse = await apiClient.get(
          `/api/users/${encodeURIComponent(userId)}`
        );

        if (!userResponse.ok) {
          throw new Error("Gagal mengambil informasi akun pengguna.");
        }

        const userData = await userResponse.json();
        userPhone = userData.phone?.trim() ?? "";
      }
    }

    // Untuk pengiriman pengguna login, sumber alamat adalah AddressSelector.
    if (
      deliveryMethod === "shipping" &&
      isAuthenticated &&
      !selectedAddress
    ) {
      toast.error("Silakan pilih alamat pengiriman terlebih dahulu.");
      return;
    }

    const address = selectedAddress;

    // Tentukan sumber data berdasarkan status login dan metode pengiriman.
    const contact = {
      name:
        deliveryMethod === "shipping" && isAuthenticated
          ? address?.recipientName ?? ""
          : isAuthenticated
            ? address?.recipientName || session?.user?.name || checkoutForm.name
            : checkoutForm.name,

      phone:
        deliveryMethod === "pickup" && isAuthenticated
          ? userPhone
          : deliveryMethod === "shipping" && isAuthenticated
            ? address?.phone ?? ""
            : isAuthenticated
              ? address?.phone || checkoutForm.phone
              : checkoutForm.phone,

      email: isAuthenticated ? accountEmail : checkoutForm.email.trim().toLowerCase(),

      adress:
        deliveryMethod === "shipping" && isAuthenticated
          ? address?.adress ?? ""
          : checkoutForm.adress,

      postalCode:
        deliveryMethod === "shipping" && isAuthenticated
          ? address?.postalCode ?? ""
          : checkoutForm.postalCode,

      city:
        deliveryMethod === "shipping" && isAuthenticated
          ? address?.city ?? ""
          : checkoutForm.city,

      province:
        deliveryMethod === "shipping" && isAuthenticated
          ? address?.province ?? ""
          : checkoutForm.province,

      district:
        deliveryMethod === "shipping" && isAuthenticated
          ? address?.district ?? ""
          : checkoutForm.district,
    };

    // Validasi kontak menggunakan data final, bukan checkoutForm secara langsung.
    const validationErrors: string[] = [];

    if (contact.name.trim().length < 2) {
      validationErrors.push("Nama minimal 2 karakter.");
    }

    if (contact.phone.trim().length < 10) {
      validationErrors.push("Nomor telepon minimal 10 digit.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
      validationErrors.push("Masukkan alamat email yang valid.");
    }

    if (deliveryMethod === "shipping") {
      const requiredFields = [
        ["adress", "Alamat"],
        ["postalCode", "Kode pos"],
        ["city", "Kota"],
        ["province", "Provinsi"],
        ["district", "Kecamatan"],
      ] as const;

      for (const [field, label] of requiredFields) {
        if (!contact[field]?.trim()) {
          validationErrors.push(`${label} wajib diisi.`);
        }
      }
    }

    if (validationErrors.length > 0) {
      validationErrors.forEach((message) => toast.error(message));
      return;
    }

    setIsSubmitting(true);

    try {
      let userId: string | null = null;

      if (isAuthenticated) {
        // Gunakan ID dari session jika tersedia.
        // Jika tidak tersedia, gunakan mekanisme pencarian user yang ada.
        userId = session?.user?.id ?? null;

        if (!userId && session?.user?.email) {
          const userResponse = await apiClient.get(
            `/api/users/email/${encodeURIComponent(session.user.email)}`
          );

          if (userResponse.ok) {
            const userData = await userResponse.json();
            userId = userData.id ?? null;
          }
        }

        if (!userId) {
          throw new Error(
            "Identitas akun tidak ditemukan. Silakan login kembali."
          );
        }
      }

      // Buat payload dari sumber data yang sudah divalidasi.
      const orderData = {
        name: contact.name.trim(),
        phone: contact.phone.trim(),
        email: contact.email,

        deliveryMethod:
          deliveryMethod === "pickup" ? "PICKUP" : "SHIPPING",

        adress:
          deliveryMethod === "shipping" ? contact.adress.trim() : null,

        postalCode:
          deliveryMethod === "shipping" ? contact.postalCode.trim() : null,

        city:
          deliveryMethod === "shipping" ? contact.city.trim() : null,

        province:
          deliveryMethod === "shipping" ? contact.province.trim() : null,

        district:
          deliveryMethod === "shipping" ? contact.district.trim() : null,

        orderNotice: checkoutForm.orderNotice.trim() || null,
          status: "pending",
          total,
          userId,
      };

      const response = await apiClient.post("/api/orders", orderData);

      if (!response.ok) {
        let errorData: {
          error?: string;
          message?: string;
          details?: string | { field?: string; message?: string }[];
        } = {};

        try {
          errorData = await response.json();
        } catch {
          // Respons server mungkin bukan JSON.
        }

        if (response.status === 409) {
          throw new Error(
            errorData.message ||
              errorData.error ||
              "Pesanan duplikat terdeteksi. Silakan coba kembali."
          );
        }

        if (Array.isArray(errorData.details)) {
          errorData.details.forEach((detail) => {
            toast.error(
              `${detail.field ? `${detail.field}: ` : ""}${detail.message ?? "Data tidak valid."}`
            );
          });

          return;
        }

        throw new Error(
          typeof errorData.details === "string"
            ? errorData.details
            : errorData.message ||
                errorData.error ||
                "Gagal membuat pesanan."
        );
      }

      const data = await response.json();
      const orderId: string | undefined = data.id;

      if (!orderId) {
        throw new Error("ID pesanan tidak diterima dari server.");
      }

      // Tambahkan setiap produk ke pesanan.
      for (const product of products) {
        await addOrderProduct(
          orderId,
          product.productId,
          product.variantId,
          product.amount
        );
      }

      if (deliveryMethod === "pickup" && !selectedStoreId) {
        toast.error("Silakan pilih lokasi toko untuk pengambilan pesanan.");
        return;
      }

      if (deliveryMethod === "pickup") {
        const selectedStore = PICKUP_STORES.find(
          (store) => store.id === selectedStoreId
        );
        sessionStorage.setItem(
          "pickupContact",
          JSON.stringify({
            name: checkoutForm.name.trim(),
            phone: checkoutForm.phone.trim(),
            email: checkoutForm.email.trim(),
            orderNotice: checkoutForm.orderNotice.trim(),
            orderId: orderId,
            total: total,
            selectedStoreName: selectedStore?.name
          })
        );
      }

      setCheckoutForm({
        name: "",
        phone: "",
        email: "",
        district: "",
        adress: "",
        province: "",
        city: "",
        postalCode: "",
        orderNotice: "",
      });

      clearCart();

      window.dispatchEvent(new CustomEvent("orderCompleted"));

      toast.success("Pesanan berhasil dibuat.");

      if (deliveryMethod === "shipping") {
        router.push(`/payment?orderId=${encodeURIComponent(orderId)}`);
      } else {
        router.push(`/pickup`);
      }

    } catch (error: unknown) {
      console.error("Error creating order:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal membuat pesanan. Silakan coba kembali."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const addOrderProduct = async (
    orderId: string,
    productId: string,
    variantId: string | null,
    productQuantity: number
  ) => {
    const response = await apiClient.post("/api/order-product", {
      customerOrderId: orderId,
      productId,
      variantId,
      quantity: productQuantity,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Product order failed: ${response.status} ${errorText}`
      );
    }

    return response.json();
  };


  useEffect(() => {
    if (products.length === 0) {
      toast.error("You don't have items in your cart");
      router.push("/cart");
    }
  }, []);

  return (
    <div className="bg-white">
      <div className="hidden h-full w-1/2 bg-white lg:block" aria-hidden="true" />
      <div className="hidden h-full w-1/2 bg-gray-50 lg:block" aria-hidden="true" />

      <main className="relative mx-auto mt-4 grid w-full max-w-screen-2xl grid-cols-1 px-3 sm:px-6 lg:mt-0 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-0 lg:px-8 xl:gap-x-10">
        <h1 className="sr-only">Order information</h1>

        {deliveryMethod === "shipping" && isLoggedIn && (
          <div className="order-2 min-w-0 lg:order-1 lg:col-start-1 lg:row-start-1">
            <CheckoutAddressSection
              selectedAddressId={selectedAddressId}
              onSelect={handleSelectAddress}
              onAddAddress={() => {
                // Hubungkan ke modal atau halaman tambah alamat.
              }}
            />

             <CheckoutActionButton
                deliveryMethod={deliveryMethod}
                isLoggedIn={isLoggedIn}
                isSubmitting={isSubmitting}
                hasSelectedAddress={Boolean(selectedAddress)}
                onPurchase={() => void makePurchase()}
                onRegister={() => router.push("/register")}
                className="mt-6 block lg:hidden"
              />
          </div>
          
        )}

        {deliveryMethod === "pickup" && isLoggedIn && (
          <CheckoutNotice
            title="Pengambilan Pesanan di Toko"
            description="Silakan ambil pesanan Anda secara langsung di toko kami. Dengan memilih metode pengambilan di toko, Anda tidak perlu menunggu pengiriman ke alamat tujuan."
            variant="pickup"
            className="mt-8 hidden lg:block"
          />
        )}
        
        {deliveryMethod === "shipping" && !isLoggedIn && (
          <div className="flex flex-col gap-2 order-2 mt-8 lg:order-1 lg:col-start-1 lg:row-start-1">
            <CheckoutNotice
              title="Mohon Maaf, Registrasi Diperlukan"
              description="Untuk menggunakan metode pengiriman ke alamat tujuan, Anda perlu melakukan registrasi terlebih dahulu. Setelah registrasi selesai, Anda dapat melanjutkan proses checkout."
            >
              <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-600 hidden lg:block">
                Registrasi hanya perlu dilakukan satu kali untuk mempermudah proses
                pemesanan Anda berikutnya.
              </div>
              
            </CheckoutNotice>
            <button
                type="button"
                onClick={() => router.push("/register")}
                className={`lg:hidden w-full rounded-md bg-[#02054b] px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                Registrasi Sekarang
              </button>
          </div>
          
        )}

        {/* Order Summary */}
        <OrderSummary
          products={products}
          total={total}
          deliveryMethod={deliveryMethod}
          setDeliveryMethod={(method: DeliveryMethod) => {
            setDeliveryMethod(method);

            if (method === "pickup") {
              setIsContactModalOpen(false);
            }
          }}
          isLoggedIn={isLoggedIn}
          isSubmitting={isSubmitting}
          hasSelectedAddress={Boolean(selectedAddress)}
          onPurchase={() => void makePurchase()}
          onRegister={() => router.push("/register")}
        />

        {deliveryMethod === "pickup" && (
          <PickupSection
            isLoggedIn={isLoggedIn}
            checkoutForm={checkoutForm}
            setCheckoutForm={setCheckoutForm}
            selectedStoreId={selectedStoreId}
            setSelectedStoreId={setSelectedStoreId}
            isSubmitting={isSubmitting}
            deliveryMethod={deliveryMethod}
            hasSelectedAddress={Boolean(selectedAddress)}
            onPurchase={() => void makePurchase()}
            onRegister={() => router.push("/register")}
          />
        )}

        {isSessionLoading ? (
          <p className="mt-6 text-sm text-gray-500">
            Memeriksa akun...
          </p>
        ) : null}


      </main>
    </div>
  );
};

export default CheckoutPage;
