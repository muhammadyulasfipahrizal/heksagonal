"use client";

import { getImageSrc } from "@/lib/utils";

export type PickupStoreId = "balikpapan" | "samarinda";

export type PickupStore = {
  id: PickupStoreId;
  name: string;
  address: string;
  mapUrl: string;
  embedUrl: string;
//   shareUrl: string;
//   phoneNumbers: string[];
};

export const PICKUP_STORES: PickupStore[] = [
  {
    id: "balikpapan",
    name: "Toko Heksagonal Balikpapan",
    address:
      "Ruko Balikpapan Regency, W3/20, Jejeran Waterpark, Balikpapan Selatan, Balikpapan, Kalimantan Timur.",
    mapUrl:
      "https://www.google.com/maps/place/Toko+Perkakas+Heksagonal/@-1.2300295,116.8918493,17z/",
    embedUrl:
      "https://maps.google.com/maps?q=-1.2300295,116.8918493&z=16&output=embed",
    // shareUrl: "https://share.google/DdYLd70y3LBXG5VR8",
    // phoneNumbers: ["0816 4952 8478", "0852 4606 9655"],
  },
  {
    id: "samarinda",
    name: "Toko Heksagonal Samarinda",
    address:
      "Jl. Jakarta, Perumahan Apel Biru Hills, Blok A2 No. 7, Kelurahan Loa Bakung, Kecamatan Sungai Kunjang, Kota Samarinda, Kalimantan Timur 75243.",
    mapUrl:
      "https://www.google.com/maps?cid=6209953336018047561",
    embedUrl:
      "https://maps.google.com/maps?q=Perumahan+Apel+Biru+Hills+Blok+A2+No+7+Loa+Bakung+Samarinda&z=16&output=embed",
    // shareUrl: "https://share.google/8WxpkfI4BeWZtUFYl",
    // phoneNumbers: ["0816 4952 8478", "0852 4606 9655"],
  },
];

type PickupStoreSelectorProps = {
  selectedStoreId: PickupStoreId | "";
  onSelect: (storeId: PickupStoreId) => void;
};

export default function PickupStoreSelector({
  selectedStoreId,
  onSelect,
}: PickupStoreSelectorProps) {
  const selectedStore = PICKUP_STORES.find(
    (store) => store.id === selectedStoreId
  );

  return (
    <section className="mt-8">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">
          Pilih Lokasi Pengambilan
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600 hidden lg:block">
          Pilih toko tempat Anda ingin mengambil pesanan.
          Pastikan lokasi sudah sesuai sebelum melanjutkan.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PICKUP_STORES.map((store) => {
          const isSelected = selectedStoreId === store.id;

          return (
            <button
              key={store.id}
              type="button"
              onClick={() => onSelect(store.id)}
              aria-pressed={isSelected}
              className={`rounded-xl border-2 p-4 text-left transition ${
                isSelected
                  ? "border-[#02054b] bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-400"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {store.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    {store.address}
                  </p>
                </div>

                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-[#02054b] bg-[#02054b] text-white"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <span className="text-xs">✓</span>
                  )}
                </span>
              </div>

              <p className="mt-3 text-sm font-medium text-[#02054b]">
                {isSelected ? "Lokasi dipilih" : "Pilih lokasi ini"}
              </p>
            </button>
          );
        })}
      </div>

      {selectedStore && (
        <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white hidden lg:block">
          {/* Nama toko dan alamat: tampil di semua ukuran layar */}
          <div className="p-4 sm:p-5">
            <h3 className="font-bold text-gray-900">
              {selectedStore.name}
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              {selectedStore.address}
            </p>
          </div>

          {/* Google Maps: hanya tampil di desktop */}
          <div>
            <iframe
              title={`Peta ${selectedStore.name}`}
              src={getImageSrc(selectedStore.embedUrl)}
              width="100%"
              height="300"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />

            <div className="flex flex-wrap gap-3 p-4 sm:p-5">
              <a
                href={selectedStore.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-[#02054b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-950"
              >
                Buka Google Maps
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}