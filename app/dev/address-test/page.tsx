"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import addressApi from "@/lib/addressApi";

type Address = {
  id: string;
  name: string;
  phone: string;
  label?: string | null;
  adress: string;
  postalCode: string;
  city: string;
  province: string;
  district: string;
  isDefault: boolean;
};

export default function AddressTestPage() {
  const { data: session, status } = useSession();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [addressId, setAddressId] = useState("");

  const [form, setForm] = useState({
    name: "Muhammad",
    phone: "081234567890",
    label: "Rumah",
    adress: "Jl. Contoh No. 10",
    postalCode: "76114",
    city: "Balikpapan",
    province: "Kalimantan Timur",
    district: "Balikpapan Selatan",
    isDefault: false,
  });

  console.log("NextAuth status:", status);
console.log("NextAuth user:", session?.user);

  async function getAddresses() {
  setLoading(true);
  setMessage("");

  try {
    const response = await addressApi.get("/");

    console.log("GET /api/addresses status:", response.status);
    console.log("GET /api/addresses response:", response.data);

    const data = response.data;

    // Mendukung respons berbentuk { addresses: [...] }
    // maupun array langsung [...]
    const addressList = Array.isArray(data)
      ? data
      : data?.addresses;

    if (!Array.isArray(addressList)) {
      setAddresses([]);
      setMessage(
        "Respons API tidak memiliki daftar alamat yang valid. Periksa console browser."
      );
      return;
    }

    setAddresses(addressList);
    setMessage(`GET berhasil: ${addressList.length} alamat ditemukan.`);
  } catch (error: any) {
    console.error("GET addresses error:", error);
    console.error("API error response:", error.response?.data);

    setMessage(
      `GET gagal: ${
        error.response?.status ?? ""
      } ${
        error.response?.data?.error ??
        error.message ??
        "Unknown error"
      }`
    );
  } finally {
    setLoading(false);
  }
}

  async function createAddress() {
    setLoading(true);
    setMessage("");

    try {
      const response = await addressApi.post("/", form);
      setMessage("POST berhasil: " + response.data.message);
      await getAddresses();
    } catch (error: any) {
      setMessage(
        `POST gagal: ${error.response?.status ?? ""} ${
          error.response?.data?.error ?? error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateAddress() {
    if (!addressId.trim()) {
      setMessage("Masukkan ID alamat yang ingin diperbarui.");
      return;
    }

    setLoading(true);

    try {
      const response = await addressApi.put(
        `/${encodeURIComponent(addressId)}`,
        { label: form.label, adress: form.adress }
      );

      setMessage("PUT berhasil: " + response.data.message);
      await getAddresses();
    } catch (error: any) {
      setMessage(
        `PUT gagal: ${error.response?.status ?? ""} ${
          error.response?.data?.error ?? error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteAddress() {
    if (!addressId.trim()) {
      setMessage("Masukkan ID alamat yang ingin dihapus.");
      return;
    }

    if (!window.confirm("Yakin ingin menghapus alamat ini?")) return;

    setLoading(true);

    try {
      const response = await addressApi.delete(
        `/${encodeURIComponent(addressId)}`
      );

      setMessage("DELETE berhasil: " + response.data.message);
      setAddressId("");
      await getAddresses();
    } catch (error: any) {
      setMessage(
        `DELETE gagal: ${error.response?.status ?? ""} ${
          error.response?.data?.error ?? error.message
        }`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      void getAddresses();
    }
  }, [status]);

  if (status === "loading") return <p>Memeriksa session...</p>;

  if (status === "unauthenticated") {
    return <p>Silakan login terlebih dahulu untuk menguji API alamat.</p>;
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Address API Test</h1>

      <p>
        Login sebagai: <strong>{session?.user?.email}</strong>
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white"
          disabled={loading}
          onClick={getAddresses}
        >
          GET Addresses
        </button>

        <button
          className="rounded bg-green-600 px-4 py-2 text-white"
          disabled={loading}
          onClick={createAddress}
        >
          POST Create
        </button>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Data alamat untuk POST</h2>

        {Object.entries(form).map(([key, value]) =>
          key === "isDefault" ? (
            <label key={key} className="flex gap-2">
              <input
                type="checkbox"
                checked={Boolean(value)}
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
            <input
              key={key}
              className="w-full rounded border p-2"
              placeholder={key}
              value={String(value)}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
            />
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
            className="rounded bg-amber-500 px-4 py-2 text-white"
            disabled={loading}
            onClick={updateAddress}
          >
            PUT Update
          </button>

          <button
            className="rounded bg-red-600 px-4 py-2 text-white"
            disabled={loading}
            onClick={deleteAddress}
          >
            DELETE Address
          </button>
        </div>
      </section>

      {message && (
        <p className="break-words rounded bg-gray-100 p-3 text-gray-900">
          {message}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          Daftar alamat ({addresses.length})
        </h2>

        {addresses.map((address) => (
          <article key={address.id} className="rounded border p-4">
            <p className="font-semibold">
              {address.label || "Alamat"} — {address.name}
            </p>
            <p>{address.phone}</p>
            <p>
              {address.adress}, {address.district}, {address.city},{" "}
              {address.province} {address.postalCode}
            </p>
            <p>ID: {address.id}</p>
            <p>Alamat utama: {address.isDefault ? "Ya" : "Tidak"}</p>

            <button
              className="mt-2 rounded border px-3 py-1"
              onClick={() => setAddressId(address.id)}
            >
              Pilih ID untuk PUT/DELETE
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}