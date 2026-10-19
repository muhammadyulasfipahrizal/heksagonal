"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/sanitize";

import PickupStoreSelector, {
  type PickupStoreId,
} from "@/components/PickupStoreSelector";

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
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <p className="text-sm font-semibold text-[#02054b]">
            HEKSAGONAL CHECKOUT
          </p>

          <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            Pembayaran & Pengambilan Pesanan
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
            Pesanan Anda telah dibuat dengan metode pickup toko.
            Silakan hubungi admin untuk mendapatkan instruksi pembayaran
            dan mengonfirmasi jadwal pengambilan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Informasi pembayaran */}
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm lg:col-span-3">
            <div className="h-1.5 bg-[#02054b]" />

            <div className="p-6 sm:p-8">
              <h2 className="text-lg font-bold text-gray-900">
                Ringkasan Pembayaran
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Simpan informasi ini untuk konfirmasi kepada admin.
              </p>

              <div className="mt-6 rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">
                  Nomor Pesanan
                </p>

                <p className="mt-1 break-all font-semibold text-gray-900">
                  {contact.orderId}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">
                  Lokasi Pengambilan
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {contact.selectedStoreName}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between gap-4 rounded-xl bg-blue-50 p-5">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Total Pembayaran
                  </p>
                  <p className="mt-1 text-xs text-blue-800">
                    Metode pengambilan: Pickup Toko
                  </p>
                </div>

                <p className="text-right text-lg font-bold text-[#02054b] sm:text-xl">
                  {formatRupiah(contact.total)}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold text-gray-900">
                  Instruksi Pembayaran
                </h3>

                <ol className="mt-4 space-y-4">
                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-[#02054b]">
                      1
                    </span>
                    <p className="text-sm leading-6 text-gray-600">
                      Hubungi admin melalui WhatsApp menggunakan tombol
                      di bawah untuk meminta instruksi pembayaran.
                    </p>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-[#02054b]">
                      2
                    </span>
                    <p className="text-sm leading-6 text-gray-600">
                      Lakukan pembayaran sesuai metode dan rekening
                      atau instruksi resmi yang diberikan admin.
                    </p>
                  </li>

                  <li className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-[#02054b]">
                      3
                    </span>
                    <p className="text-sm leading-6 text-gray-600">
                      Kirim bukti pembayaran kepada admin dan tunggu
                      konfirmasi pembayaran sebelum mengambil pesanan.
                    </p>
                  </li>
                </ol>
              </div>

              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm leading-6 text-amber-900">
                  <strong>Perhatian:</strong> Jangan melakukan pembayaran
                  ke rekening yang belum dikonfirmasi oleh admin.
                  Pastikan pembayaran telah diverifikasi sebelum datang
                  ke toko.
                </p>
              </div>
            </div>
          </section>

          {/* Mekanisme pickup */}
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm lg:col-span-2">
            <div className="h-1.5 bg-[#02054b]" />

            <div className="p-6 sm:p-8">
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

              <h2 className="mt-5 text-lg font-bold text-gray-900">
                Mekanisme Pickup Toko
              </h2>

              <div className="mt-5 space-y-5">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    1. Konfirmasi Pembayaran
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Hubungi admin untuk mendapatkan instruksi pembayaran
                    dan konfirmasi nominal pesanan.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    2. Tunggu Konfirmasi Admin
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Pastikan pembayaran telah diverifikasi dan admin
                    mengonfirmasi bahwa pesanan siap diambil.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    3. Ambil Pesanan di Toko
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    Datang sesuai jadwal yang disepakati dengan admin
                    dan sampaikan nomor pesanan Anda.
                  </p>
                </div>
              </div>

              <div className="mt-7 border-t border-gray-200 pt-6">
                <p className="text-sm leading-6 text-gray-600">
                  Siapkan nomor pesanan berikut saat menghubungi admin:
                </p>

                <p className="mt-2 break-all rounded-lg bg-gray-50 p-3 text-sm font-semibold text-gray-900">
                  {contact.orderId}
                </p>

                <button
                  type="button"
                  onClick={handleContactAdmin}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#02054b] px-4 py-3.5 font-semibold text-white transition hover:bg-blue-950"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M20.52 3.48A11.82 11.82 0 0 0 12.08 0C5.5 0 .15 5.35.15 11.93c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 0 0 5.8 1.48h.01c6.57 0 11.92-5.35 11.92-11.93 0-3.18-1.24-6.17-3.48-8.43ZM12.08 21.8h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.72.97.99-3.63-.23-.37a9.85 9.85 0 0 1-1.52-5.25c0-5.46 4.44-9.9 9.9-9.9a9.83 9.83 0 0 1 7 2.9 9.84 9.84 0 0 1 2.9 7c0 5.46-4.45 9.9-9.91 9.9Zm5.43-7.42c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.47-2.4-1.5-.88-.79-1.48-1.77-1.65-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.09 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
                  </svg>

                  Hubungi Admin & Bayar
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-gray-500">
                  WhatsApp akan menyiapkan pesan berisi informasi kontak,
                  nomor pesanan, dan total pembayaran. Anda tetap perlu
                  menekan tombol Kirim di WhatsApp.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-[#02054b] hover:underline"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}