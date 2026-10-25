
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import apiClient from "@/lib/api";
import { formatRupiah } from "@/lib/sanitize";

type Order = {
  id: string;
  name: string;
  email: string;
  total: number;
  status: string;
  deliveryMethod: "PICKUP" | "SHIPPING";
  dateTime?: string;
};

const BANK_NAME = "BCA";
const BANK_ACCOUNT_NAME = "HEKSAGONAL";
const VIRTUAL_ACCOUNT_NUMBER = "763476735";

// Ganti dengan nomor WhatsApp admin, format internasional tanpa tanda +.
const ADMIN_WHATSAPP_NUMBER = "6285753344206";

export default function PaymentPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningWhatsApp, setIsOpeningWhatsApp] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (sessionStatus === "loading") return;

    if (sessionStatus !== "authenticated") {
      toast.error("Silakan login untuk melihat pembayaran pesanan.");
      router.replace("/login");
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get("orderId");

      if (!orderId) {
        throw new Error(
          "Nomor pesanan tidak ditemukan. Silakan pilih pesanan terlebih dahulu."
        );
      }

      let userId = session.user?.id ?? null;

      if (!userId && session.user?.email) {
        const userResponse = await apiClient.get(
          `/api/users/email/${encodeURIComponent(session.user.email)}`
        );

        if (userResponse.ok) {
          const userData = await userResponse.json();
          userId = userData.id ?? null;
        }
      }

      if (!userId) {
        throw new Error("Identitas akun tidak ditemukan. Silakan login kembali.");
      }

      const response = await apiClient.get(
        `/api/orders/my-orders?${new URLSearchParams({
          userId,
          page: "1",
          limit: "100",
        }).toString()}`
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data pesanan.");
      }

      const result = await response.json();
      const orders: Order[] = result.orders ?? [];

      const matchedOrder = orders.find(
        (item) => String(item.id) === orderId
      );

      if (!matchedOrder) {
        throw new Error(
          "Pesanan tidak ditemukan pada akun ini. Periksa kembali nomor pesanan."
        );
      }

      setOrder(matchedOrder);
    } catch (error) {
      console.error("Failed to load payment order:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Gagal memuat informasi pembayaran."
      );
    } finally {
      setIsLoading(false);
    }
  }, [sessionStatus, session?.user?.id, session?.user?.email, router]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText(VIRTUAL_ACCOUNT_NUMBER);
      toast.success("Nomor virtual account berhasil disalin.");
    } catch {
      toast.error("Tidak dapat menyalin nomor rekening.");
    }
  };

  const handlePaymentConfirmation = () => {
    if (!order || isOpeningWhatsApp) return;

    const amount = Number(order.total);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Nominal pembayaran pesanan tidak valid.");
      return;
    }

    const message = [
      "Halo Admin HEKSAGONAL, saya ingin menginformasikan bahwa saya sudah melakukan pembayaran.",
      "",
      `Nama: ${order.name}`,
      `Email: ${order.email}`,
      `Nomor pesanan: ${order.id}`,
      `Metode pesanan: ${
        order.deliveryMethod === "PICKUP" ? "Pickup Toko" : "Pengiriman"
      }`,
      `Nominal pesanan: ${formatRupiah(amount)}`,
      `Bank tujuan: ${BANK_NAME}`,
      `Virtual account: ${VIRTUAL_ACCOUNT_NUMBER}`,
      "",
      "Mohon dilakukan pengecekan dan konfirmasi pembayaran. Terima kasih.",
    ].join("\n");

    const whatsappUrl =
      `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=` +
      encodeURIComponent(message);

    setIsOpeningWhatsApp(true);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    setIsOpeningWhatsApp(false);
  };

  if (isLoading || sessionStatus === "loading") {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-white px-4">
        <p className="text-sm text-gray-500">
          Memuat informasi pembayaran...
        </p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-[60vh] bg-white px-4 py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 p-6 text-center">
          <h1 className="text-xl font-bold text-gray-900">
            Pesanan tidak ditemukan
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Silakan buka halaman pesanan dan pilih pesanan yang ingin dibayar.
          </p>
          <button
            type="button"
            onClick={() => router.push("/orders")}
            className="mt-5 rounded-lg bg-[#02054b] px-5 py-3 font-semibold text-white hover:bg-blue-950"
          >
            Lihat Pesanan
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#02054b]/10 text-[#02054b]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              className="h-7 w-7"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 10h18M7 15h4" />
            </svg>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
            Pembayaran Pesanan
          </h1>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Selesaikan pembayaran sesuai nominal berikut, lalu beri tahu admin
            melalui WhatsApp.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="bg-[#02054b] px-5 py-5 text-white sm:px-7">
            <p className="text-sm text-white/75">Total yang harus dibayar</p>
            <p className="mt-1 text-3xl font-bold">
              {formatRupiah(Number(order.total))}
            </p>
            <p className="mt-3 text-sm text-white/80">
              Nomor pesanan: {order.id}
            </p>
          </div>

          <div className="space-y-6 p-5 sm:p-7">
            <section>
              <h2 className="text-base font-bold text-gray-900">
                Informasi Rekening
              </h2>

              <div className="mt-4 rounded-xl border border-gray-200 p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Bank tujuan</p>
                    <p className="mt-1 text-lg font-bold text-gray-900">
                      {BANK_NAME}
                    </p>
                  </div>
                  <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700">
                    Virtual Account
                  </span>
                </div>

                <div className="mt-5 border-t border-gray-100 pt-4">
                  <p className="text-xs text-gray-500">Nama penerima</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {BANK_ACCOUNT_NAME}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-xs text-gray-500">
                    Nomor Rekening
                  </p>

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="break-all text-xl font-bold tracking-wider text-[#02054b]">
                      {VIRTUAL_ACCOUNT_NUMBER}
                    </p>

                    <button
                      type="button"
                      onClick={() => void handleCopyAccount()}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        className="h-4 w-4"
                        aria-hidden="true"
                      >
                        <rect x="8" y="8" width="12" height="12" rx="2" />
                        <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                      </svg>
                      Salin
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900">
                Petunjuk Pembayaran
              </h2>

              <ol className="mt-3 space-y-3">
                {[
                  "Buka aplikasi mobile banking atau internet banking Anda.",
                  `Transfer ke rekening ${BANK_NAME} dengan nomor yang tertera di atas.`,
                  `Pastikan nominal transfer tepat sebesar ${formatRupiah(Number(order.total))}.`,
                  'Setelah transfer berhasil, tekan tombol "Saya Sudah Bayar" di bawah.',
                ].map((instruction, index) => (
                  <li key={instruction} className="flex gap-3 text-sm leading-6 text-gray-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#02054b]/10 text-xs font-bold text-[#02054b]">
                      {index + 1}
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#02054b]"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5m0-8h.01" />
                </svg>

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Konfirmasi pembayaran
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Setelah Anda menekan tombol konfirmasi, WhatsApp akan
                    terbuka dengan informasi pesanan Anda. Admin akan
                    memeriksa pembayaran dan memperbarui status pesanan
                    melalui dashboard. Menekan tombol ini tidak otomatis
                    menandai pesanan sebagai lunas.
                  </p>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={handlePaymentConfirmation}
              disabled={isOpeningWhatsApp}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#02054b] px-5 py-4 font-bold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M20.52 3.48A11.82 11.82 0 0 0 12.1 0C5.57 0 .25 5.3.25 11.82c0 2.08.55 4.1 1.6 5.9L.15 24l6.43-1.68a11.9 11.9 0 0 0 5.52 1.37h.01c6.52 0 11.84-5.31 11.84-11.83 0-3.16-1.23-6.13-3.43-8.38ZM12.1 21.66a9.86 9.86 0 0 1-5.02-1.37l-.36-.21-3.82 1 1.02-3.72-.24-.38a9.8 9.8 0 0 1-1.5-5.16c0-5.4 4.4-9.8 9.82-9.8a9.75 9.75 0 0 1 6.94 2.88 9.75 9.75 0 0 1 2.87 6.95c0 5.4-4.4 9.81-9.81 9.81Zm5.39-7.35c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.28-.47-2.44-1.5-.9-.8-1.51-1.78-1.69-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.23-.24-.58-.49-.5-.68-.51h-.58c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.5 0 1.47 1.07 2.9 1.22 3.1.15.2 2.1 3.2 5.09 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
              </svg>
              Saya Sudah Bayar
            </button>

            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="w-full rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              Kembali ke Pesanan
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
