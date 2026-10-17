"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useSession } from "next-auth/react";
import addressApi from "@/lib/addressApi";
import RegionSelector from "@/components/RegionSelector";

type Address = {
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
  createdAt?: string;
  updatedAt?: string;
};

type AddressForm = Omit<
  Address,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

type AddressListResponse = {
  addresses: Address[];
};

type AddressMutationResponse = {
  message?: string;
  address?: Address;
};

type AddressApiError = Error & {
  status?: number;
  data?: unknown;
};

type Props = {
  selectedAddressId: string;
  onSelect: (address: Address) => void;
  onAddAddress?: () => void;
};

const initialForm: AddressForm = {
  recipientName: "",
  phone: "",
  label: "Rumah",
  adress: "",
  postalCode: "",
  city: "",
  province: "",
  district: "",
  isDefault: false,
};

function getAddressApiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Terjadi kesalahan yang tidak diketahui.";
  }

  const apiError = error as AddressApiError;
  const prefix =
    typeof apiError.status === "number"
      ? `${apiError.status}: `
      : "";

  return `${prefix}${error.message}`;
}

export default function AddressSelector({
  selectedAddressId,
  onSelect,
  onAddAddress,
}: Props) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(
    null
  );
  const [form, setForm] = useState<AddressForm>(initialForm);

  const isEditing = editingAddressId !== null;
  const isBusy = saving || deletingId !== null;

  const loadAddresses = useCallback(
    async (preferredAddressId?: string) => {
        if (!userId) {
        setAddresses([]);
        setLoading(false);
        return;
        }

        setLoading(true);
        setError("");

        try {
        const response = (await addressApi.get(
            userId
        )) as AddressListResponse;

        if (!Array.isArray(response?.addresses)) {
            throw new Error("Format respons daftar alamat tidak valid.");
        }

        const result = response.addresses;
        setAddresses(result);

        // Prioritaskan alamat yang baru dibuat atau diperbarui.
        const preferredAddress = result.find(
            (address) => address.id === preferredAddressId
        );

        // Jika tidak ada alamat pilihan khusus, pertahankan pilihan lama.
        const currentAddress = result.find(
            (address) => address.id === selectedAddressId
        );

        const defaultAddress = result.find(
            (address) => address.isDefault
        );

        const nextAddress =
            preferredAddress ??
            currentAddress ??
            defaultAddress ??
            result[0];

        if (nextAddress) {
            // Selalu kirim objek terbaru dari hasil GET ke parent.
            onSelect(nextAddress);
        }
        } catch (err) {
        setError(
            err instanceof Error
            ? err.message
            : "Gagal memuat daftar alamat."
        );
        } finally {
        setLoading(false);
        }
    },
    [userId, selectedAddressId, onSelect]
    );

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setAddresses([]);
      setLoading(false);
      return;
    }

    void loadAddresses();
  }, [status, loadAddresses]);

  function openCreateModal() {
    setEditingAddressId(null);
    setForm({ ...initialForm });
    setError("");
    setNotice("");
    setIsModalOpen(true);
  }

  function openEditModal(address: Address) {
    setEditingAddressId(address.id);
    setForm({
      recipientName: address.recipientName,
      phone: address.phone,
      label: address.label ?? "",
      adress: address.adress,
      postalCode: address.postalCode,
      city: address.city,
      province: address.province,
      district: address.district,
      isDefault: address.isDefault,
    });
    setError("");
    setNotice("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setIsModalOpen(false);
    setEditingAddressId(null);
    setForm({ ...initialForm });
    setError("");
  }

  function handleFormChange<K extends keyof AddressForm>(
    field: K,
    value: AddressForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!userId) {
      setError("User ID tidak tersedia. Silakan login kembali.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const payload = {
        ...form,
        recipientName: form.recipientName.trim(),
        phone: form.phone.trim(),
        label: form.label?.trim() || "Alamat",
        adress: form.adress.trim(),
        postalCode: form.postalCode.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        district: form.district.trim(),
        userId,
      };

      const response = isEditing
        ? ((await addressApi.put(editingAddressId!, payload)) as AddressMutationResponse)
        : ((await addressApi.post(payload)) as AddressMutationResponse);

        setIsModalOpen(false);
        setEditingAddressId(null);
        setForm({ ...initialForm });
        setNotice(response.message ?? "Alamat berhasil disimpan.");

        await loadAddresses(response.address?.id);
    } catch (err: unknown) {
      setError(getAddressApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(address: Address) {
    if (!userId) {
      setError("User ID tidak tersedia. Silakan login kembali.");
      return;
    }

    const confirmed = window.confirm(
      `Yakin ingin menghapus alamat "${address.label || "Alamat"}"?`
    );

    if (!confirmed) return;

    setDeletingId(address.id);
    setError("");
    setNotice("");

    try {
      const response = (await addressApi.delete(
        address.id,
        userId
      )) as AddressMutationResponse;

      setAddresses((current) =>
        current.filter((item) => item.id !== address.id)
      );

      if (editingAddressId === address.id) {
        setIsModalOpen(false);
        setEditingAddressId(null);
      }

      setNotice(response?.message ?? "Alamat berhasil dihapus.");

      // Memilih alamat utama atau alamat pertama jika alamat
      // yang sedang dipilih telah dihapus.
      const remainingAddresses = addresses.filter(
        (item) => item.id !== address.id
      );

      if (selectedAddressId === address.id && remainingAddresses.length > 0) {
        const defaultAddress = remainingAddresses.find(
          (item) => item.isDefault
        );

        onSelect(defaultAddress ?? remainingAddresses[0]);
      }

      await loadAddresses();
    } catch (err: unknown) {
      setError(getAddressApiErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  }

  if (status === "loading" || loading) {
    return (
      <p className="text-sm text-gray-500">
        Memuat alamat...
      </p>
    );
  }

  // if (status === "unauthenticated") {
  //   return (
  //     <p className="text-sm text-red-600">
  //       Silakan login untuk menggunakan alamat yang tersimpan.
  //     </p>
  //   );
  // }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Alamat Pengiriman
        </h2>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={isBusy}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          Tambah alamat
        </button>
      </div>

      {notice && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700"
        >
          {notice}
        </p>
      )}

      {error && !isModalOpen && (
        <div className="space-y-2">
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void loadAddresses()}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Coba muat ulang
          </button>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed p-5 text-center">
          <p className="text-sm text-gray-600">
            Anda belum memiliki alamat tersimpan.
          </p>

          <button
            type="button"
            onClick={openCreateModal}
            className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Tambah alamat baru
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => {
            const selected = address.id === selectedAddressId;
            const deleting = deletingId === address.id;

            return (
              <div
                key={address.id}
                className={`flex items-start gap-2 rounded-lg border p-3 transition sm:p-4 ${
                  selected
                    ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                    : "border-gray-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(address)}
                  aria-pressed={selected}
                  disabled={isBusy}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left disabled:cursor-not-allowed"
                >
                  <input
                    type="radio"
                    name="checkout-address"
                    checked={selected}
                    readOnly
                    tabIndex={-1}
                    className="mt-1 accent-blue-600"
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        {address.label || "Alamat"}
                      </span>

                      {address.isDefault && (
                        <span className="rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                          Alamat utama
                        </span>
                      )}

                      {selected && (
                        <span className="text-xs font-medium text-blue-600">
                          Dipilih
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium">
                      {address.recipientName}
                    </p>

                    <p className="text-sm text-gray-600">
                      {address.phone}
                    </p>

                    <p className="break-words text-sm text-gray-700">
                      {address.adress}, {address.district},{" "}
                      {address.city}, {address.province}{" "}
                      {address.postalCode}
                    </p>
                  </div>
                </button>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    title="Edit alamat"
                    aria-label={`Edit alamat ${address.label || address.recipientName}`}
                    disabled={isBusy}
                    onClick={() => openEditModal(address)}
                    className="rounded-md p-2 text-gray-500 hover:bg-white hover:text-blue-600 disabled:opacity-40"
                  >
                    edit
                  </button>

                  <button
                    type="button"
                    title="Hapus alamat"
                    aria-label={`Hapus alamat ${address.label || address.recipientName}`}
                    disabled={isBusy}
                    onClick={() => void handleDelete(address)}
                    className="rounded-md p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    {deleting ? (
                      <span className="text-xs">...</span>
                    ) : (
                        "delete"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal tambah dan edit alamat */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-modal-title"
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
              <h3
                id="address-modal-title"
                className="text-lg font-semibold"
              >
                {isEditing ? "Edit Alamat" : "Tambah Alamat Baru"}
              </h3>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Tutup modal"
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {error && (
                <p
                  role="alert"
                  className="rounded-md bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium">
                    Nama penerima *
                  </span>
                  <input
                    required
                    maxLength={100}
                    autoComplete="name"
                    value={form.recipientName}
                    onChange={(event) =>
                      handleFormChange("recipientName", event.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Nama penerima"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium">
                    Nomor telepon *
                  </span>
                  <input
                    required
                    type="tel"
                    maxLength={25}
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) =>
                      handleFormChange("phone", event.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="08xxxxxxxxxx"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium">
                    Label alamat
                  </span>
                  <input
                    maxLength={50}
                    value={form.label ?? ""}
                    onChange={(event) =>
                      handleFormChange("label", event.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Rumah, Kantor, dan lainnya"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium">
                    Kode pos *
                  </span>
                  <input
                    required
                    maxLength={10}
                    autoComplete="postal-code"
                    value={form.postalCode}
                    onChange={(event) =>
                      handleFormChange("postalCode", event.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Kode pos"
                  />
                </label>
              </div>

              <label className="block space-y-1">
                <span className="text-sm font-medium">
                  Alamat lengkap *
                </span>
                <textarea
                  required
                  rows={3}
                  maxLength={1000}
                  autoComplete="street-address"
                  value={form.adress}
                  onChange={(event) =>
                    handleFormChange("adress", event.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Nama jalan, nomor rumah, RT/RW, dan lainnya"
                />
              </label>

              <RegionSelector
                province={form.province}
                city={form.city}
                district={form.district}
                disabled={saving}
                onChange={({ province, city, district }) => {
                    setForm((current) => ({
                    ...current,
                    province,
                    city,
                    district,
                    }));
                }}
                />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(event) =>
                    handleFormChange("isDefault", event.target.checked)
                  }
                  className="h-4 w-4 accent-blue-600"
                />
                Jadikan alamat utama
              </label>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : isEditing
                      ? "Simpan Perubahan"
                      : "Tambah Alamat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}