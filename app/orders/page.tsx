"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import apiClient from "@/lib/api";

type OrderProduct = {
  id: string;
  title: string;
  slug: string;
  mainImage: string | null;
  price: number;
  quantity: number;
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
  products: {
    id: string;
    quantity: number;
    product: OrderProduct;
  }[];
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
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            Akun Saya / Pesanan
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Pesanan Saya
          </h1>

          <p className="mt-2 text-gray-500">
            Lihat riwayat pesanan dan produk yang telah kamu pesan.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Total Pesanan</p>
            <p className="mt-2 text-3xl font-bold text-[#02054b]">
              {pagination.total}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <p className="text-sm text-gray-500">Halaman</p>
            <p className="mt-2 text-3xl font-bold text-[#02054b]">
              {pagination.totalPages > 0 ? page : 0}
              <span className="text-lg font-medium text-gray-400">
                {" "}
                / {pagination.totalPages}
              </span>
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={() => void fetchOrders()}
              className="self-start font-semibold underline sm:self-auto"
            >
              Coba lagi
            </button>
          </div>
        )}

        {!error && orders.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <h2 className="text-xl font-bold text-gray-900">
              Belum Ada Pesanan
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Pesanan yang kamu buat akan muncul di halaman ini.
            </p>

            <Link
              href="/shop"
              className="mt-6 inline-flex rounded-xl bg-[#02054b] px-6 py-3 font-semibold text-white transition hover:bg-blue-950"
            >
              Mulai Belanja
            </Link>
          </div>
        )}

        <div className="space-y-6">
          {orders.map((order) => (
            <article
              key={order.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                    Nomor Pesanan
                  </p>

                  <h2 className="mt-1 break-all text-lg font-bold text-[#02054b]">
                    #{order.id}
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    {formatDate(order.dateTime)}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusStyle(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              <div className="space-y-6 p-5 sm:p-6">
                <section>
                  <h3 className="mb-4 text-sm font-semibold text-gray-900">
                    Produk Pesanan ({order.products?.length ?? 0})
                  </h3>

                  <div className="space-y-4">
                    {(order.products ?? []).map((item) => {
                      const product = item.product;

                      if (!product) return null;

                      return (
                        <div key={item.id} className="flex gap-4">
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 sm:h-24 sm:w-24">
                            {product.mainImage ? (
                              <Image
                                src={`/${product?.mainImage}`}
                                alt={product.title}
                                fill
                                sizes="96px"
                                className="object-contain p-2"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                No Image
                              </div>
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col justify-center">
                            <p className="line-clamp-2 font-semibold text-gray-900">
                              {product.title}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                              {formatPrice(Number(product.price))} ×{" "}
                              {item.quantity}
                            </p>

                            <p className="mt-2 font-semibold text-[#02054b]">
                              {formatPrice(
                                Number(product.price) * item.quantity
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-xl bg-gray-50 p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Informasi Pemesanan
                  </h3>

                  <dl className="mt-3 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-gray-500">Nama Penerima</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {order.name}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-500">Nomor Telepon</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {order.phone}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-500">Email</dt>
                      <dd className="mt-1 break-all font-medium text-gray-900">
                        {order.email}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-gray-500">Metode Pengiriman</dt>
                      <dd className="mt-1 font-medium text-gray-900">
                        {order.deliveryMethod === "SHIPPING"
                          ? "Kirim Alamat"
                          : "Pickup Toko"}
                      </dd>
                    </div>

                    {order.deliveryMethod === "SHIPPING" && (
                      <div className="sm:col-span-2">
                        <dt className="text-gray-500">
                          Alamat Pengiriman
                        </dt>
                        <dd className="mt-1 font-medium leading-relaxed text-gray-900">
                          {[
                            order.adress,
                            order.district,
                            order.city,
                            order.province,
                            order.postalCode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </dd>
                      </div>
                    )}

                    {order.orderNotice && (
                      <div className="sm:col-span-2">
                        <dt className="text-gray-500">
                          Catatan Pesanan
                        </dt>
                        <dd className="mt-1 whitespace-pre-wrap font-medium text-gray-900">
                          {order.orderNotice}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>

                <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
                  <div>
                    <p className="text-sm text-gray-500">
                      Total Pembayaran
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {(order.products ?? []).reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      )}{" "}
                      item
                    </p>
                  </div>

                  <p className="text-xl font-bold text-[#02054b]">
                    {formatPrice(Number(order.total))}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {pagination.totalPages > 1 && (
          <nav
            aria-label="Navigasi halaman pesanan"
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="join-item btn btn-lg bg-[#02054b] text-white hover:bg-white hover:text-[#02054b] disabled:opacity-50"
            >
              «
            </button>

            <button
              type="button"
              className="join-item btn btn-lg bg-[#02054b] text-white hover:bg-white hover:text-[#02054b]"
            >
              Page {page}
            </button>

            <button
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="join-item btn btn-lg bg-[#02054b] text-white hover:bg-white hover:text-[#02054b]"
            >
              »
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}