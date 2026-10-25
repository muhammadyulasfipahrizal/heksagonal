"use client";
import { SectionTitle } from "@/components";
import { useProductStore } from "../_zustand/store";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { formatRupiah } from "@/lib/sanitize";
import { ContactForm, CheckoutFormData  } from "@/components/ContactForm";
import AddressSelector from "@/components/AddressSelector";

import PickupStoreSelector, {
  type PickupStoreId,
  PICKUP_STORES,
} from "@/components/PickupStoreSelector";

type CheckoutAddress = {
  id: string;
  userId: string;
  recipientName: string;
  phone: string;
  label: string | null;
  adress: string;
  postalCode: string;
  city: string;
  province: string;
  district: string;
  isDefault: boolean;
};

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
          product.id,
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
    productQuantity: number
  ) => {
    try {
      console.log("️ Adding product to order:", {
        customerOrderId: orderId,
        productId,
        quantity: productQuantity
      });
      
      const response = await apiClient.post("/api/order-product", {
        customerOrderId: orderId,
        productId: productId,
        quantity: productQuantity,
      });

      console.log("📡 Product order response:", response);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Product order failed:", response.status, errorText);
        throw new Error(`Product order failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Product order successful:", data);
      
    } catch (error) {
      console.error("💥 Error creating product order:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (products.length === 0) {
      toast.error("You don't have items in your cart");
      router.push("/cart");
    }
  }, []);

  return (
    <div className="bg-white">
      {/* <SectionTitle title="Checkout" path="Home | Cart | Checkout" /> */}
      
      <div className="hidden h-full w-1/2 bg-white lg:block" aria-hidden="true" />
      <div className="hidden h-full w-1/2 bg-gray-50 lg:block" aria-hidden="true" />

      <main className="relative mx-auto grid max-w-screen-2xl grid-cols-1 gap-x-4 lg:grid-cols-2 lg:px-8 xl:gap-x-6">
        <h1 className="sr-only">Order information</h1>

        {deliveryMethod !== "pickup" && isLoggedIn && (
          <AddressSelector
            selectedAddressId={selectedAddressId}
            onSelect={handleSelectAddress}
            onAddAddress={() => {
              // Hubungkan ke modal atau halaman tambah alamat.
            }}
          />
        )}

        {deliveryMethod === "pickup" && isLoggedIn && (
          <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="h-1 bg-[#02054b]" />

            <div className="flex items-start gap-4 p-5 sm:p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#02054b]/[0.06] text-[#02054b]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 10h18l-2-6H5l-2 6Zm2 0v10h14V10M9 20v-6h6v6"
                  />
                </svg>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold tracking-tight text-gray-900">
                  Pengambilan Pesanan di Toko
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Silakan ambil pesanan Anda secara langsung di toko kami.
                  Dengan memilih metode pengambilan di toko, Anda tidak
                  perlu menunggu pengiriman ke alamat tujuan.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {deliveryMethod !== "pickup" && !isLoggedIn && (
          <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="h-1 bg-[#02054b]" />

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#02054b]/[0.06] text-[#02054b]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 11v5m0-8h.01"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold tracking-tight text-gray-900">
                    Mohon Maaf, Registrasi Diperlukan
                  </h3>
                </div>

                <p className="mt-2 text-sm leading-6 text-gray-600">
                  Mohon maaf atas ketidaknyamanannya. Untuk menggunakan
                  metode pengiriman ke alamat tujuan, Anda perlu melakukan
                  registrasi terlebih dahulu. Setelah registrasi selesai,
                  Anda dapat melanjutkan proses checkout.
                </p>

                <div className="mt-4 flex items-start gap-2 rounded-xl bg-gray-50 p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#02054b]"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                  <p className="text-xs leading-5 text-gray-600">
                    Registrasi hanya perlu dilakukan satu kali untuk
                    mempermudah proses pemesanan Anda berikutnya.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <section
          aria-labelledby="summary-heading"
          className="bg-gray-50 px-4 pb-10 pt-16 sm:px-6 lg:col-start-2 lg:row-start-1 lg:bg-transparent lg:px-0 lg:pb-16"
        >
          <div className="mx-auto max-w-lg">
            <h2 id="summary-heading" className="text-lg font-medium text-gray-900">
              Ringkasan Order
            </h2>

            <ul
              role="list"
              className="divide-y divide-gray-200 text-sm font-medium text-gray-900"
            >
              {products.map((product) => (
                <li key={product?.id} className="flex items-start space-x-4 py-6">
                  <Image
                    src={product?.image ? `/${product?.image}` : "/product_placeholder.jpg"}
                    alt={product?.title}
                    width={80}
                    height={80}
                    className="h-20 w-20 flex-none rounded-md object-cover object-center"
                  />
                  <div className="flex-auto space-y-1">
                    <h3>{product?.title}</h3>
                    <p className="text-gray-500">x{product?.amount}</p>
                  </div>
                  <p className="flex-none text-base font-medium">
                    {formatRupiah(product?.price)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="hidden space-y-6 border-t border-gray-200 pt-6 text-sm font-medium text-gray-900 lg:block">
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Subtotal</dt>
                <dd>{formatRupiah(total)}</dd>
              </div>
              {/* {deliveryMethod === "shipping" && (
                <div className="flex items-center justify-between">
                  <dt className="text-gray-600">Pengiriman</dt>
                  <dd>{formatRupiah(50000)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Pajak</dt>
                <dd>{formatRupiah(total / 10)}</dd>
              </div> */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <dt className="text-base">Total</dt>
                <dd className="text-base">
                  {formatRupiah(total)}
                </dd>
              </div>
            </dl>
            
            <div className="mt-6 space-y-3">
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
                  onChange={() => {
                    setDeliveryMethod("pickup");
                    setIsContactModalOpen(false);
                  }}
                  className="mt-1 accent-[#02054b]"
                />

                <span>
                  <span className="block font-medium text-gray-900">
                    Pickup Toko
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    Ambil pesanan langsung di toko. Tidak perlu mengisi
                    formulir alamat.
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
                    Pesanan dikirim ke alamat penerima. Informasi kontak
                    dan alamat wajib diisi.
                  </span>
                </span>
              </label>

              
            {deliveryMethod === "pickup" ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => void makePurchase()}
                className="w-full rounded-md bg-[#02054b] px-4 py-3
                  font-semibold text-white hover:bg-blue-950
                  disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Memproses Pesanan..." : "Buat Pesanan"}
                </button>
              ) : isLoggedIn ? (
                <button
                  type="button"
                  disabled={isSubmitting || !selectedAddress}
                  onClick={() => void makePurchase()}
                  className="w-full rounded-md bg-[#02054b] px-4 py-3
                    font-semibold text-white hover:bg-blue-950
                    disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Memproses Pesanan..."
                    : !selectedAddress
                      ? "Pilih Alamat Pengiriman"
                      : "Buat Pesanan"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  // onClick={() => setIsContactModalOpen(true)}
                  className="w-full rounded-md bg-[#02054b] px-4 py-3
                    font-semibold text-white hover:bg-blue-950"
                >
                  Registrasi Sekarang
                </button>
              )}
            </div>
          </div>
        </section>

        {!isLoggedIn && deliveryMethod === "pickup" && (
          <form className="px-4 sm:px-6 lg:col-start-1 lg:row-start-1 lg:px-0">
            <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="h-1 bg-[#02054b]" />

              <div className="flex items-start gap-4 p-5 sm:p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#02054b]/[0.06] text-[#02054b]">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    className="h-6 w-6"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h18l-2-6H5l-2 6Zm2 0v10h14V10M9 20v-6h6v6"
                    />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold tracking-tight text-gray-900">
                    Pengambilan Pesanan di Toko
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Silakan ambil pesanan Anda secara langsung di toko kami.
                    Dengan memilih metode pengambilan di toko, Anda tidak
                    perlu menunggu pengiriman ke alamat tujuan.
                  </p>
                </div>
              </div>
            </div>
          <div className="mx-auto max-w-lg lg:max-w-none">
            {/* Contact Information */}
            <section aria-labelledby="contact-info-heading">
              <div className="mt-6">
                <label
                  htmlFor="name-input"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nama
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.name}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        name: e.target.value,
                      })
                    }
                    type="text"
                    id="name-input"
                    name="name-input"
                    autoComplete="given-name"
                    required
                    disabled={isSubmitting}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="phone-input"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nomor Telepon
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.phone}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        phone: e.target.value,
                      })
                    }
                    type="tel"
                    id="phone-input"
                    name="phone-input"
                    autoComplete="tel"
                    required
                    disabled={isSubmitting}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label
                  htmlFor="email-address"
                  className="block text-sm font-medium text-gray-700"
                >
                  Alamat Email
                </label>
                <div className="mt-1">
                  <input
                    value={checkoutForm.email}
                    onChange={(e) =>
                      setCheckoutForm({
                        ...checkoutForm,
                        email: e.target.value,
                      })
                    }
                    type="email"
                    id="email-address"
                    name="email-address"
                    autoComplete="email"
                    required
                    disabled={isSubmitting}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-6">
                  <label
                    htmlFor="order-notice"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Catatan
                  </label>
                  <div className="mt-1">
                    <textarea
                      className="textarea textarea-bordered min-h-32 w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                      id="order-notice"
                      name="order-notice"
                      autoComplete="order-notice"
                      disabled={isSubmitting}
                      value={checkoutForm.orderNotice}
                      onChange={(e) =>
                        setCheckoutForm({
                          ...checkoutForm,
                          orderNotice: e.target.value,
                        })
                      }
                    ></textarea>
                  </div>
                </div>
                
                <PickupStoreSelector
                  selectedStoreId={selectedStoreId}
                  onSelect={setSelectedStoreId}
                />
            </section>
          </div>
        </form>
        )}

        {isLoggedIn && deliveryMethod === "pickup" && (
          <form className="px-4 sm:px-6 lg:col-start-1 lg:row-start-1 lg:px-0">
            <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="h-1 bg-[#02054b]" />

                
                <PickupStoreSelector
                  selectedStoreId={selectedStoreId}
                  onSelect={setSelectedStoreId}
                />
          </div>
        </form>
        )}
        
        {isContactModalOpen && deliveryMethod === "shipping" && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center
              bg-black/50 p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setIsContactModalOpen(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-modal-title"
              className="relative max-h-[90vh] w-full max-w-2xl
                overflow-y-auto rounded-xl bg-white p-5 shadow-xl
                sm:p-8"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2
                  id="contact-modal-title"
                  className="text-xl font-semibold text-gray-900"
                >
                  Informasi Pengiriman
                </h2>

                <button
                  type="button"
                  aria-label="Tutup formulir"
                  onClick={() => setIsContactModalOpen(false)}
                  className="rounded-md p-2 text-gray-500
                    hover:bg-gray-100 hover:text-gray-900"
                >
                  ✕
                </button>
              </div>

              <ContactForm
                checkoutForm={checkoutForm}
                setCheckoutForm={setCheckoutForm}
                isSubmitting={isSubmitting}
                makePurchase={makePurchase}
              />
            </div>
          </div>
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
