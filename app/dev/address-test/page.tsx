"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import addressApi from "@/lib/addressApi";

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
  message: string;
  address?: Address;
};

type AddressApiError = Error & {
  status?: number;
  data?: unknown;
};

const initialForm: AddressForm = {
  recipientName: "Muhammad",
  phone: "081234567890",
  label: "Rumah",
  adress: "Jl. Contoh No. 10",
  postalCode: "76114",
  city: "Balikpapan",
  province: "Kalimantan Timur",
  district: "Balikpapan Selatan",
  isDefault: false,
};

function getAddressApiErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Unknown error";
  }

  const apiError = error as AddressApiError;
  const prefix =
    typeof apiError.status === "number"
      ? `${apiError.status} `
      : "";

  return `${prefix}${error.message}`.trim();
}

export default function AddressTestPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [addressId, setAddressId] = useState("");
  const [form, setForm] = useState<AddressForm>(initialForm);

  const getAddresses = useCallback(async () => {
    if (!userId) {
      setAddresses([]);
      setMessage("GET gagal: User ID tidak tersedia.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = (await addressApi.get(
        userId
      )) as AddressListResponse;

      if (!Array.isArray(response?.addresses)) {
        setAddresses([]);
        setMessage("GET gagal: Respons API tidak valid.");
        return;
      }

      setAddresses(response.addresses);
      setMessage(
        `GET berhasil: ${response.addresses.length} alamat ditemukan.`
      );
    } catch (error: unknown) {
      setMessage(`GET gagal: ${getAddressApiErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  async function createAddress() {
    if (!userId) {
      setMessage("POST gagal: User ID tidak tersedia.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = (await addressApi.post({
        ...form,
        userId,
      })) as AddressMutationResponse;

      setMessage(response.message ?? "POST berhasil.");
      await getAddresses();
    } catch (error: unknown) {
      setMessage(`POST gagal: ${getAddressApiErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function updateAddress() {
    if (!addressId.trim()) {
      setMessage("Masukkan ID alamat yang ingin diperbarui.");
      return;
    }

    if (!userId) {
      setMessage("PUT gagal: User ID tidak tersedia.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = (await addressApi.put(addressId, {
        ...form,
        userId,
      })) as AddressMutationResponse;

      setMessage(response.message ?? "PUT berhasil.");
      await getAddresses();
    } catch (error: unknown) {
      setMessage(`PUT gagal: ${getAddressApiErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteAddress() {
    if (!addressId.trim()) {
      setMessage("Masukkan ID alamat yang ingin dihapus.");
      return;
    }

    if (!userId) {
      setMessage("DELETE gagal: User ID tidak tersedia.");
      return;
    }

    if (!window.confirm("Yakin ingin menghapus alamat ini?")) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = (await addressApi.delete(
        addressId,
        userId
      )) as AddressMutationResponse;

      setMessage(response.message ?? "DELETE berhasil.");
      setAddressId("");
      await getAddresses();
    } catch (error: unknown) {
      setMessage(`DELETE gagal: ${getAddressApiErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated" && userId) {
      void getAddresses();
    } else if (status === "authenticated" && !userId) {
      setAddresses([]);
      setMessage("User ID tidak tersedia pada session.");
    }
  }, [status, userId, getAddresses]);

  if (status === "loading") {
    return <p className="p-6">Memeriksa session...</p>;
  }

  if (status === "unauthenticated") {
    return (
      <p className="p-6">
        Silakan login terlebih dahulu untuk menguji API alamat.
      </p>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Address API Test</h1>

      <div className="space-y-1">
        <p>
          Login sebagai: <strong>{session?.user?.email}</strong>
        </p>
        <p className="break-all text-sm text-gray-500">
          User ID: {userId ?? "Tidak tersedia"}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={loading || !userId}
          onClick={() => void getAddresses()}
        >
          GET Addresses
        </button>

        <button
          type="button"
          className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
          disabled={loading || !userId}
          onClick={() => void createAddress()}
        >
          POST Create
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Data alamat untuk POST</h2>

        {Object.entries(form).map(([key, value]) =>
          key === "isDefault" ? (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value as boolean}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isDefault: event.target.checked,
                  }))
                }
              />
              Jadikan alamat utama
            </label>
          ) : (
            <label key={key} className="block space-y-1">
              <span className="text-sm text-gray-600">{key}</span>
              <input
                className="w-full rounded border p-2"
                value={String(value ?? "")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    [key]: event.target.value,
                  }))
                }
              />
            </label>
          )
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">PUT / DELETE</h2>

        <input
          className="w-full rounded border p-2"
          placeholder="ID alamat"
          value={addressId}
          onChange={(event) => setAddressId(event.target.value)}
        />

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded bg-amber-500 px-4 py-2 text-white disabled:opacity-50"
            disabled={loading || !userId}
            onClick={() => void updateAddress()}
          >
            PUT Update
          </button>

          <button
            type="button"
            className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
            disabled={loading || !userId}
            onClick={() => void deleteAddress()}
          >
            DELETE Address
          </button>
        </div>
      </section>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className="break-words rounded bg-gray-100 p-3 text-gray-900"
        >
          {message}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Daftar alamat ({addresses.length})
        </h2>

        {addresses.length === 0 && (
          <p className="text-sm text-gray-500">
            Belum ada alamat atau data belum berhasil dimuat.
          </p>
        )}

        {addresses.map((address) => (
          <article key={address.id} className="rounded border p-4">
            <p className="font-semibold">
              {address.label || "Alamat"} — {address.recipientName}
            </p>

            <p>{address.phone}</p>

            <p>
              {address.adress}, {address.district}, {address.city},{" "}
              {address.province} {address.postalCode}
            </p>

            <p className="break-all">ID: {address.id}</p>
            <p>Alamat utama: {address.isDefault ? "Ya" : "Tidak"}</p>

            <button
              type="button"
              className="mt-2 rounded border px-3 py-1"
              onClick={() => {
                setAddressId(address.id);
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
              }}
            >
              Pilih alamat untuk PUT/DELETE
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}