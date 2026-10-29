"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";
import { getImageSrc } from "@/lib/utils";

type OrderVariant = {
  id: string;
  title: string | null;
  price: number;
  image: string | null;
  isDefault: boolean;
};

type OrderProduct = {
  id: string;
  title: string;
  slug: string;
  mainImage: string | null;
  price: number;
  variants: OrderVariant[];
};

type OrderItem = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number | null;
  product: {
    id: string;
    title: string;
    mainImage: string;
  };
  variant: {
    id: string;
    title: string | null;
    price: number;
    image: string | null;
  } | null;
};

type Order = {
  id: string;
  name: string;
  email: string;
  phone: string;
  deliveryMethod: "PICKUP" | "SHIPPING";
  adress: string | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  district: string | null;
  orderNotice: string | null;
  total: number;
  status: string;
  dateTime: string;
  products: OrderItem[];
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type OrdersResponse = {
  orders: Order[];
  pagination?: Pagination;
  message?: string;
  error?: string;
};

type ApiError = Error & {
  status?: number;
  data?: unknown;
};

const PAGE_SIZE = 1;

const formatPrice = (price: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));

const getStatusStyle = (status: string) => {
  const normalized = status.toLowerCase();

  if (["confirmed", "completed", "delivered"].includes(normalized)) {
    return "bg-green-100 text-green-700";
  }

  if (["cancelled", "canceled", "rejected"].includes(normalized)) {
    return "bg-red-100 text-red-700";
  }

  if (["pending"].includes(normalized)) {
    return "bg-amber-100 text-amber-800";
  }

  if (["processing", "shipped"].includes(normalized)) {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-gray-100 text-gray-700";
};

async function parseResponse(response: Response): Promise<OrdersResponse> {
  let data: unknown;

  try {
    data = await response.json();
  } catch {
    data = undefined;
  }

  if (!response.ok) {
    const body =
      typeof data === "object" && data !== null
        ? (data as Record<string, unknown>)
        : {};

    const message =
      (typeof body.message === "string" && body.message) ||
      (typeof body.error === "string" && body.error) ||
      `Gagal memuat pesanan (HTTP ${response.status}).`;

    const error = new Error(message) as ApiError;
    error.status = response.status;
    error.data = data;

    throw error;
  }

  if (
    typeof data !== "object" ||
    data === null ||
    !Array.isArray((data as OrdersResponse).orders)
  ) {
    throw new Error("Format respons daftar pesanan tidak valid.");
  }

  return data as OrdersResponse;
}

function getApiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Terjadi kesalahan yang tidak diketahui.";
  }

  const apiError = error as ApiError;

  if (apiError.status === 401) {
    return "Sesi autentikasi tidak dikenali oleh server. Silakan login kembali atau periksa konfigurasi autentikasi API.";
  }

  if (apiError.status === 403) {
    return "Kamu tidak memiliki izin untuk melihat pesanan ini.";
  }

  return apiError.message || "Gagal memuat pesanan. Silakan coba kembali.";
}

export default function OrdersPage() {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id;

  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setPagination({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 0,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        userId,
        page: String(page),
        limit: String(PAGE_SIZE),
      });

      const response = await apiClient.get(
        `/api/orders/my-orders?${params.toString()}`,
        { credentials: "include" }
      );

      console.log("Orders API response:", response);

      const result = await parseResponse(response);

      setOrders(result.orders);
      setPagination(
        result.pagination ?? {
          page,
          limit: PAGE_SIZE,
          total: result.orders.length,
          totalPages: result.orders.length > 0 ? 1 : 0,
        }
      );
    } catch (err: unknown) {
      console.error("Failed to fetch orders:", err);
      setError(getApiErrorMessage(err));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [userId, page]);

  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (sessionStatus === "unauthenticated") {
      setOrders([]);
      setLoading(false);
      return;
    }

    if (sessionStatus === "authenticated") {
      void fetchOrders();
    }
  }, [sessionStatus, fetchOrders]);

  if (sessionStatus === "loading" || loading) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-4 py-12 sm:px-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-36 rounded-2xl bg-gray-100" />
          <div className="h-36 rounded-2xl bg-gray-100" />
        </div>
      </main>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Pesanan Saya
        </h1>

        <p className="mt-2 max-w-md text-gray-500">
          Silakan login terlebih dahulu untuk melihat riwayat pesananmu.
        </p>

        <Link
          href="/login"
          className="mt-6 rounded-xl bg-[#02054b] px-6 py-3 font-semibold text-white transition hover:bg-blue-950"
        >
          Login
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-3 py-6 sm:px-6 sm:py-10 lg:py-12">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-semibold text-gray-500 sm:text-sm">
            Akun Saya <span className="mx-1 text-gray-300">/</span> Pesanan
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
                Pesanan Saya
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                Pantau status, detail produk, dan riwayat pesanan Anda.
              </p>
            </div>

            {/* <Link
              href="/shop"
              className="inline-flex min-h-10 w-fit items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-[#02054b] transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02054b] focus-visible:ring-offset-2"
            >
              + Belanja Lagi
            </Link> */}
          </div>
        </header>

        {/* Ringkasan */}
        <section
          aria-label="Ringkasan pesanan"
          className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4"
        >
          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <p className="text-xs font-medium text-gray-500 sm:text-sm">
              Total Pesanan
            </p>

            <p className="mt-2 text-2xl font-extrabold text-[#02054b] sm:text-3xl">
              {pagination.total}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Seluruh pesanan
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
            <p className="text-xs font-medium text-gray-500 sm:text-sm">
              Halaman Aktif
            </p>

            <p className="mt-2 text-2xl font-extrabold text-[#02054b] sm:text-3xl">
              {pagination.totalPages > 0 ? page : 0}
              <span className="text-base font-medium text-gray-400 sm:text-lg">
                {" "}/ {pagination.totalPages}
              </span>
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Navigasi pesanan
            </p>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={() => void fetchOrders()}
              className="min-h-10 self-start font-semibold underline underline-offset-4 sm:self-auto"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && orders.length === 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center sm:px-8 sm:py-16">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#02054b]/5 text-[#02054b]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
                className="h-7 w-7"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6"
                />
                <circle cx="10" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
            </div>

            <h2 className="mt-5 text-lg font-bold text-gray-900 sm:text-xl">
              Belum Ada Pesanan
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Pesanan yang Anda buat akan muncul di sini. Mulai jelajahi
              produk untuk menemukan kebutuhan Anda.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#02054b] px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02054b] focus-visible:ring-offset-2"
            >
              Mulai Belanja
            </Link>
          </section>
        )}

        {/* Daftar Pesanan */}
        {!error && orders.length > 0 && (
          <div className="space-y-5 sm:space-y-6">
            {orders.map((order) => {
              const products = order.products ?? [];
              const totalItems = products.reduce(
                (sum, item) => sum + item.quantity,
                0
              );

              return (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Header Pesanan */}
                  <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                        Nomor Pesanan
                      </p>

                      <h2 className="mt-1 break-all text-base font-extrabold text-[#02054b] sm:text-lg">
                        #{order.id}
                      </h2>

                      <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                        {formatDate(order.dateTime)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit max-w-full items-center rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-5 p-4 sm:space-y-6 sm:p-5 lg:p-6">
                    {/* Produk */}
                    <section aria-label="Produk pesanan">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                          Produk Pesanan
                        </h3>

                        <span className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                          {totalItems} item
                        </span>
                      </div>

                      <div className="divide-y divide-gray-100">
                        {products.map((item) => {
                          const product = item.product;
                          const variant = item.variant;

                          if (!product) return null;

                          const unitPrice = Number(
                            item.price ?? variant?.price ?? 0
                          );

                          const subtotal = unitPrice * item.quantity;
                          const productImage = variant?.image?.trim();

                          const imagePath = productImage
                            ? productImage.startsWith("http://") ||
                              productImage.startsWith("https://") ||
                              productImage.startsWith("/")
                              ? productImage
                              : `/${productImage}`
                            : null;

                          return (
                            <div
                              key={item.id}
                              className="flex gap-3 py-4 first:pt-0 last:pb-0 sm:gap-4"
                            >
                              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 sm:h-24 sm:w-24">
                                {imagePath ? (
                                  <Image
                                    src={getImageSrc(imagePath)}
                                    alt={`${product.title}${
                                      variant?.title
                                        ? ` - ${variant.title}`
                                        : ""
                                    }`}
                                    fill
                                    sizes="(max-width: 640px) 80px, 96px"
                                    className="object-contain p-2"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center px-1 text-center text-xs text-gray-400">
                                    Gambar tidak tersedia
                                  </div>
                                )}
                              </div>

                              <div className="flex min-w-0 flex-1 flex-col justify-center">
                                <p className="line-clamp-2 text-sm font-semibold leading-5 text-gray-900 sm:text-base">
                                  {product.title}
                                </p>

                                {variant?.title && (
                                  <p className="mt-1 line-clamp-2 text-xs text-gray-500 sm:text-sm">
                                    Varian: {variant.title}
                                  </p>
                                )}

                                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                                  {formatPrice(unitPrice)} × {item.quantity}
                                </p>

                                <p className="mt-2 text-sm font-bold text-[#02054b] sm:text-base">
                                  {formatPrice(subtotal)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Informasi Pemesanan */}
                    <section className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-5">
                      <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                        Informasi Pemesanan
                      </h3>

                      <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                        <div className="min-w-0">
                          <dt className="text-xs text-gray-500 sm:text-sm">
                            Nama Penerima
                          </dt>
                          <dd className="mt-1 break-words font-medium text-gray-900">
                            {order.name || "-"}
                          </dd>
                        </div>

                        <div className="min-w-0">
                          <dt className="text-xs text-gray-500 sm:text-sm">
                            Nomor Telepon
                          </dt>
                          <dd className="mt-1 break-words font-medium text-gray-900">
                            {order.phone || "-"}
                          </dd>
                        </div>

                        <div className="min-w-0">
                          <dt className="text-xs text-gray-500 sm:text-sm">
                            Email
                          </dt>
                          <dd className="mt-1 break-all font-medium text-gray-900">
                            {order.email || "-"}
                          </dd>
                        </div>

                        <div className="min-w-0">
                          <dt className="text-xs text-gray-500 sm:text-sm">
                            Metode Pengiriman
                          </dt>
                          <dd className="mt-1 font-medium text-gray-900">
                            {order.deliveryMethod === "SHIPPING"
                              ? "Kirim ke Alamat"
                              : "Pickup Toko"}
                          </dd>
                        </div>

                        {order.deliveryMethod === "SHIPPING" && (
                          <div className="min-w-0 sm:col-span-2">
                            <dt className="text-xs text-gray-500 sm:text-sm">
                              Alamat Pengiriman
                            </dt>
                            <dd className="mt-1 break-words font-medium leading-relaxed text-gray-900">
                              {[
                                order.adress,
                                order.district,
                                order.city,
                                order.province,
                                order.postalCode,
                              ]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </dd>
                          </div>
                        )}

                        {order.orderNotice && (
                          <div className="min-w-0 sm:col-span-2">
                            <dt className="text-xs text-gray-500 sm:text-sm">
                              Catatan Pesanan
                            </dt>
                            <dd className="mt-1 whitespace-pre-wrap break-words font-medium leading-relaxed text-gray-900">
                              {order.orderNotice}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </section>

                    {/* Total */}
                    <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-5">
                      <div>
                        <p className="text-xs text-gray-500 sm:text-sm">
                          Total Pembayaran
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {totalItems} item
                        </p>
                      </div>

                      <p className="break-words text-xl font-extrabold leading-tight text-[#02054b] sm:text-right sm:text-2xl">
                        {formatPrice(Number(order.total))}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!error && pagination.totalPages > 1 && (
          <nav
            aria-label="Navigasi halaman pesanan"
            className="mt-7 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-3"
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              aria-label="Halaman sebelumnya"
              className="join-item btn btn-md min-h-11 min-w-11 border-[#02054b] bg-[#02054b] px-3 text-white hover:bg-white hover:text-[#02054b] disabled:cursor-not-allowed disabled:opacity-40 sm:btn-lg">
              «
            </button>

            <button
              type="button"
              aria-current="page"
              className="join-item btn btn-md min-h-11 border-[#02054b] bg-[#02054b] px-4 text-white hover:bg-[#15195c] sm:btn-lg"
            >
              Halaman {page}
            </button>

            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
              aria-label="Halaman berikutnya"
              className="join-item btn btn-md min-h-11 min-w-11 border-[#02054b] bg-[#02054b] px-3 text-white hover:bg-white hover:text-[#02054b] sm:btn-lg"
            >
              »
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}