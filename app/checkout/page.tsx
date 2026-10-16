"use client";
import { SectionTitle } from "@/components";
import { useProductStore } from "../_zustand/store";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api";
import { formatRupiah } from "@/lib/sanitize";
import { ContactForm, CheckoutFormData  } from "@/components/ContactForm";

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

  const [selectedAddressId, setSelectedAddressId] =
    useState("");

  const [isCreatingAddress, setIsCreatingAddress] =
    useState(false);

  const isLoggedIn = sessionStatus === "authenticated";
  const isSessionLoading = sessionStatus === "loading";

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
    const validationErrors = [
      ...validateContactForm(),
      ...(deliveryMethod === "shipping"
        ? validateShippingForm()
        : []),
    ];

    if (validationErrors.length > 0) {
      validationErrors.forEach((error) => toast.error(error));
      return;
    }

    if (products.length === 0) {
      toast.error("Keranjang belanja kosong");
      return;
    }

    if (total <= 0) {
      toast.error("Total pesanan tidak valid");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("🚀 Starting order creation...");
      
      // Get user ID if logged in
      let userId = null;
      if (session?.user?.email) {
        try {
          console.log("🔍 Getting user ID for logged-in user:", session.user.email);
          const userResponse = await apiClient.get(`/api/users/email/${session.user.email}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userId = userData.id;
            console.log("✅ Found user ID:", userId);
          } else {
            console.log("❌ Could not find user with email:", session.user.email);
          }
        } catch (userError) {
          console.log("⚠️  Error getting user ID:", userError);
        }
      }
      
      // Prepare the order data
      const orderData = {
        name: checkoutForm.name.trim(),
        phone: checkoutForm.phone.trim(),
        email: checkoutForm.email.trim().toLowerCase(),

        deliveryMethod:
          deliveryMethod === "pickup" ? "PICKUP" : "SHIPPING",

        adress:
          deliveryMethod === "shipping"
            ? checkoutForm.adress.trim()
            : null,

        postalCode:
          deliveryMethod === "shipping"
            ? checkoutForm.postalCode.trim()
            : null,

        city:
          deliveryMethod === "shipping"
            ? checkoutForm.city.trim()
            : null,

        province:
          deliveryMethod === "shipping"
            ? checkoutForm.province.trim()
            : null,

        district:
          deliveryMethod === "shipping"
            ? checkoutForm.district.trim()
            : null,

        orderNotice: checkoutForm.orderNotice.trim() || null,
        status: "pending",
        total: total,
        userId: userId,
      };

      console.log("📋 Order data being sent:", orderData);

      // Send order data to server for validation and processing
      const response = await apiClient.post("/api/orders", orderData);

      console.log("📡 API Response received:");
      console.log("  Status:", response.status);
      console.log("  Status Text:", response.statusText);
      console.log("  Response OK:", response.ok);
      
      // Check if response is ok before parsing
      if (!response.ok) {
        console.error("❌ Response not OK:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Error response body:", errorText);
        
        // Try to parse as JSON to get detailed error info
        try {
          const errorData = JSON.parse(errorText);
          console.error("Parsed error data:", errorData);
          
          // Handle different error types
          if (response.status === 409) {
            // Duplicate order error
            toast.error(errorData.details || errorData.error || "Duplicate order detected");
            return; // Don't throw, just return to stop execution
          } else if (errorData.details && Array.isArray(errorData.details)) {
            // Validation errors
            errorData.details.forEach((detail: any) => {
              toast.error(`${detail.field}: ${detail.message}`);
            });
          } else if (typeof errorData.details === 'string') {
            // Single error message in details
            toast.error(errorData.details);
          } else {
            // Fallback error message
            toast.error(errorData.error || "Order creation failed");
          }
        } catch (parseError) {
          console.error("Could not parse error as JSON:", parseError);
          toast.error("Order creation failed. Please try again.");
        }
        
        return; // Stop execution instead of throwing
      }

      const data = await response.json();
      console.log("✅ Parsed response data:", data);
      
      const orderId: string = data.id;
      console.log("🆔 Extracted order ID:", orderId);

      if (!orderId) {
        console.error("❌ Order ID is missing or falsy!");
        console.error("Full response data:", JSON.stringify(data, null, 2));
        throw new Error("Order ID not received from server");
      }

      console.log("✅ Order ID validation passed, proceeding with product addition...");

      // Add products to order
      for (let i = 0; i < products.length; i++) {
        console.log(`🛍️ Adding product ${i + 1}/${products.length}:`, {
          orderId,
          productId: products[i].id,
          quantity: products[i].amount
        });
        
        await addOrderProduct(orderId, products[i].id, products[i].amount);
        console.log(`✅ Product ${i + 1} added successfully`);
      }

      console.log(" All products added successfully!");

      // Clear form and cart
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
      
      // Refresh notification count if user is logged in
      try {
        // This will trigger a refresh of notifications in the background
        window.dispatchEvent(new CustomEvent('orderCompleted'));
      } catch (error) {
        console.log('Note: Could not trigger notification refresh');
      }
      
      toast.success("Order created successfully! You will be contacted for payment.");
      setTimeout(() => {
        router.push("/");
      }, 1000);
    } catch (error: any) {
      console.error("💥 Error in makePurchase:", error);
      
      // Handle server validation errors
      if (error.response?.status === 400) {
        console.log(" Handling 400 error...");
        try {
          const errorData = await error.response.json();
          console.log("Error data:", errorData);
          if (errorData.details && Array.isArray(errorData.details)) {
            // Show specific validation errors
            errorData.details.forEach((detail: any) => {
              toast.error(`${detail.field}: ${detail.message}`);
            });
          } else {
            toast.error(errorData.error || "Validation failed");
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
          toast.error("Validation failed");
        }
      } else if (error.response?.status === 409) {
        toast.error("Duplicate order detected. Please wait before creating another order.");
      } else {
        console.log("🔍 Handling generic error...");
        toast.error("Failed to create order. Please try again.");
      }
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
              {deliveryMethod === "shipping" && (
                <div className="flex items-center justify-between">
                  <dt className="text-gray-600">Pengiriman</dt>
                  <dd>{formatRupiah(50000)}</dd>
                </div>
              )}
              <div className="flex items-center justify-between">
                <dt className="text-gray-600">Pajak</dt>
                <dd>{formatRupiah(total / 10)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                <dt className="text-base">Total</dt>
                <dd className="text-base">
                  {formatRupiah(total === 0 ? 0 : Math.round(total + total / 10 + 50000))}
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
              ) : (
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(true)}
                  className="w-full rounded-md bg-[#02054b] px-4 py-3
                    font-semibold text-white hover:bg-blue-950"
                >
                  Isi Informasi Pengiriman
                </button>
              )}
            </div>

          </div>
        </section>

        {!isLoggedIn && (
          <form className="px-4 sm:px-6 lg:col-start-1 lg:row-start-1 lg:px-0">
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
                      className="textarea textarea-bordered textarea-lg w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            </section>
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
        ) : !isLoggedIn ? (
          <p className="mt-6 text-sm text-gray-500">
            Isi informasi kontak untuk melanjutkan pesanan.
          </p>
        ) : null}


      </main>
    </div>
  );
};

export default CheckoutPage;
