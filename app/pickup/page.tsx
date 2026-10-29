"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/sanitize";

import PickupStoreSelector, {
  type PickupStoreId,
} from "@/components/PickupStoreSelector";
import toast from "react-hot-toast";

type PickupContact = {
  name: string;
  phone: string;
  email: string;
  orderNotice: string;
  orderId: string;
  total: number;
  selectedStoreName: string;
};

const ADMIN_WHATSAPP = "6281234567890";

const BANK_NAME = "BCA";
const BANK_ACCOUNT_NAME = "HEKSAGONAL";
const VIRTUAL_ACCOUNT_NUMBER = "763476735";

// Ganti dengan nomor WhatsApp admin, format internasional tanpa tanda +.
const ADMIN_WHATSAPP_NUMBER = "6285753344206";

export default function PickupPage() {
  const [contact, setContact] = useState<PickupContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedContact = sessionStorage.getItem("pickupContact");

      if (!storedContact) return;

      const parsed: unknown = JSON.parse(storedContact);

      if (typeof parsed !== "object" || parsed === null) {
        return;
      }

      const data = parsed as Record<string, unknown>;

      if (
        typeof data.name !== "string" ||
        typeof data.phone !== "string" ||
        typeof data.email !== "string" ||
        typeof data.orderNotice !== "string" ||
        typeof data.orderId !== "string" ||
        !data.orderId.trim() ||
        typeof data.total !== "number" ||
        !Number.isFinite(data.total) ||
        data.total <= 0 ||
        typeof data.selectedStoreName !== "string" ||
        !data.selectedStoreName.trim()
      ) {
        return;
      }

      setContact({
        name: data.name,
        phone: data.phone,
        email: data.email,
        orderNotice: data.orderNotice,
        orderId: data.orderId,
        total: data.total,
        selectedStoreName: data.selectedStoreName,
      });
    } catch (error) {
      console.error("Failed to load pickup contact:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleContactAdmin = () => {
    if (!contact) return;

    const message = [
      "Halo Admin HEKSAGONAL, saya ingin mengonfirmasi pembayaran dan pengambilan pesanan melalui pickup toko.",
      "",
      "INFORMASI PEMESAN",
      `Nama: ${contact.name}`,
      `Nomor Telepon: ${contact.phone}`,
      `Email: ${contact.email}`,
      ...(contact.orderNotice
        ? [`Catatan: ${contact.orderNotice}`]
        : []),
      "",
      "INFORMASI PESANAN",
      `ID Pesanan: ${contact.orderId}`,
      `Metode: Pickup Toko`,
      `Lokasi Pengambilan: ${contact.selectedStoreName}`,
      `Total Pembayaran: ${formatRupiah(contact.total)}`,
      "",
      "Mohon informasi metode pembayaran dan konfirmasi apabila pesanan sudah dapat diambil. Terima kasih.",
    ].join("\n");

    const whatsappUrl =
      `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <p className="text-sm text-gray-600">
          Memuat informasi pesanan...
        </p>
      </main>
    );
  }

  if (!contact) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">
            Informasi Pesanan Tidak Tersedia
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Data pembayaran pickup tidak ditemukan atau tidak valid.
            Silakan periksa pesanan Anda kembali.
          </p>

          <Link
            href="/orders"
            className="mt-6 inline-flex rounded-lg bg-[#02054b] px-5 py-3 font-semibold text-white hover:bg-blue-950"
          >
            Lihat Pesanan
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-3 py-6 text-gray-900 sm:px-6 sm:py-10 lg:py-14">
      <div className="mx-auto w-full max-w-6xl">
        {/* Page Header */}
        <header className="mb-6 sm:mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#02054b] sm:text-sm">
            HEKSAGONAL CHECKOUT
          </p>

          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            Pembayaran & Pengambilan Pesanan
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base hidden lg:block">
            Pesanan Anda telah dibuat dengan metode pickup toko. Silakan
            hubungi admin untuk mendapatkan instruksi pembayaran dan
            mengonfirmasi jadwal pengambilan.
          </p>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base lg:hidden">
            Pesanan dengan metode pickup toko. Silakan
            hubungi admin untuk pembayaran dan
            konfirmasi jadwal pengambilan.
          </p>
        </header>

        <div className="grid grid-cols-1 items-start gap-5 sm:gap-6 lg:grid-cols-5 lg:gap-7">
          {/* Informasi Pembayaran */}
          <section
            aria-labelledby="payment-heading"
            className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-3"
          >
            <div className="h-1.5 bg-[#02054b]" />

            <div className="p-4 sm:p-6 lg:p-8">
              <h2
                id="payment-heading"
                className="text-lg font-bold sm:text-xl"
              >
                Petunjuk Pembayaran
              </h2>

              <p className="mt-1 text-sm leading-5 text-gray-500">
                Simpan informasi ini untuk konfirmasi kepada admin.
              </p>

              {/* Nomor Pesanan */}
              <div className="mt-5 rounded-xl border border-gray-200 p-4 sm:mt-6">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Nomor Pesanan
                </p>

                <p className="mt-2 break-all text-sm font-bold text-gray-900 sm:text-base">
                  {contact.orderId}
                </p>
              </div>

              {/* Lokasi Pickup */}
              <div className="mt-3 rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Lokasi Pengambilan
                </p>

                <p className="mt-2 break-words text-sm font-bold sm:text-base">
                  {contact.selectedStoreName}
                </p>
              </div>

              {/* Informasi Rekening */}
              <div className="mt-3 rounded-xl border border-gray-200 p-4 sm:p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Tujuan Pembayaran
                </p>

                <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Bank tujuan</p>
                    <p className="mt-1 break-words text-lg font-extrabold sm:text-xl">
                      {BANK_NAME}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-[#02054b] sm:text-sm">
                    Rekening Bank
                  </span>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500">Nama penerima</p>
                  <p className="mt-1 break-words text-sm font-semibold sm:text-base">
                    {BANK_ACCOUNT_NAME}
                  </p>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-500">Nomor Rekening</p>
                  <p className="mt-1 break-all text-xl font-extrabold tracking-wide text-[#02054b] sm:text-2xl sm:tracking-wider">
                    {VIRTUAL_ACCOUNT_NUMBER}
                  </p>
                </div>
              </div>

              {/* Total Pembayaran */}
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
                <div>
                  <p className="text-sm font-semibold text-blue-950">
                    Total Pembayaran
                  </p>
                  <p className="mt-1 text-xs leading-5 text-blue-800">
                    Metode pengambilan: Pickup Toko
                  </p>
                </div>

                <p className="break-words text-xl font-extrabold leading-tight text-[#02054b] sm:text-right sm:text-2xl">
                  {formatRupiah(contact.total)}
                </p>
              </div>

              {/* Instruksi Pembayaran */}
              <div className="mt-6 sm:mt-7">
                <h3 className="text-base font-bold sm:text-lg">
                  Instruksi Pembayaran
                </h3>

                <ol className="mt-4 space-y-4">
                  {[
                    "Buka aplikasi mobile banking atau internet banking Anda.",
                    `Transfer ke rekening ${BANK_NAME} dengan nomor yang tertera di atas.`,
                    `Pastikan nominal transfer tepat sebesar ${formatRupiah(Number(contact.total))}.`,
                    'Setelah transfer berhasil, hubungi admin melalui WhatsApp untuk konfirmasi pembayaran.',
                  ].map((instruction, index) => (
                    <li
                      key={instruction}
                      className="flex items-start gap-3 text-sm leading-6 text-gray-600"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#02054b]/10 text-xs font-bold text-[#02054b]">
                        {index + 1}
                      </span>

                      <span className="min-w-0 pt-0.5">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Peringatan */}
              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:mt-7">
                <p className="text-sm leading-6 text-amber-950">
                  <strong>Perhatian:</strong> Jangan melakukan pembayaran
                  ke rekening selain rekening yang tertera pada website ini.
                  Pastikan pembayaran telah diverifikasi oleh admin sebelum
                  datang ke toko.
                </p>
              </div>
            </div>
          </section>

          {/* Mekanisme Pickup */}
          <section
            aria-labelledby="pickup-heading"
            className="min-w-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:col-span-2"
          >
            <div className="h-1.5 bg-[#02054b]" />

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#02054b]">
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

              <h2
                id="pickup-heading"
                className="mt-4 text-lg font-bold sm:mt-5 sm:text-xl"
              >
                Mekanisme Pickup Toko
              </h2>

              <div className="mt-5 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    1. Konfirmasi Pembayaran
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Lakukan pembayaran sesuai rekening atau instruksi resmi
                    yang diberikan admin.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    2. Tunggu Konfirmasi Admin
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Hubungi admin melalui WhatsApp menggunakan tombol di bawah
                    untuk mengonfirmasi pembayaran dan jadwal pengambilan.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    3. Ambil Pesanan di Toko
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Datang sesuai jadwal yang disepakati dengan admin dan
                    sampaikan nomor pesanan Anda.
                  </p>
                </div>
              </div>

              {/* Kontak Admin */}
              <div className="mt-6 border-t border-gray-200 pt-5 sm:mt-7 sm:pt-6">
                <p className="text-sm leading-6 text-gray-600">
                  Siapkan nomor pesanan berikut saat menghubungi admin:
                </p>

                <p className="mt-3 break-all rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm font-bold text-gray-900">
                  {contact.orderId}
                </p>

                <button
                  type="button"
                  onClick={handleContactAdmin}
                  className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#02054b] px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02054b] focus-visible:ring-offset-2 active:scale-[0.99]"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true"
                  >
                    <path d="M20.52 3.48A11.82 11.82 0 0 0 12.08 0C5.5 0 .15 5.35.15 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 0 0 5.8 1.48h.01c6.57 0 11.92-5.35 11.92-11.93 0-3.18-1.24-6.17-3.48-8.43ZM12.08 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.97.99-3.63-.23-.37a9.85 9.85 0 0 1-1.52-5.25c0-5.46 4.44-9.9 9.9-9.9a9.83 9.83 0 0 1 7 2.9 9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.9-9.91 9.9Zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.47-2.4-1.5-.88-.79-1.48-1.77-1.65-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.09 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
                  </svg>

                  Hubungi Admin
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                  WhatsApp akan menyiapkan pesan berisi informasi pesanan
                  dan total pembayaran. Tekan tombol Kirim di WhatsApp
                  untuk mengirim pesan kepada admin.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Kembali ke Beranda */}
        <footer className="mt-6 pb-2 text-center sm:mt-8">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold text-[#02054b] transition-colors hover:underline"
          >
            Kembali ke Beranda
          </Link>
        </footer>
      </div>
    </main>
  );
}