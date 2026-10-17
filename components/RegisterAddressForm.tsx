
"use client";

import { useState } from "react";
import RegionSelector from "@/components/RegionSelector";

export interface RegisterAddressData {
  phone: string;
  adress: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
}

interface Props {
  value: RegisterAddressData;
  onChange: (value: RegisterAddressData) => void;
  disabled?: boolean;
}

export default function RegisterAddressForm({
  value,
  onChange,
  disabled = false,
}: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function updateField(
    field: keyof RegisterAddressData,
    nextValue: string
  ) {
    onChange({ ...value, [field]: nextValue });

    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    if (!value.phone.trim()) {
      next.phone = "Nomor telepon wajib diisi";
    }

    if (!value.adress.trim()) {
      next.adress = "Alamat lengkap wajib diisi";
    }

    if (!value.province) {
      next.province = "Pilih provinsi";
    }

    if (!value.city) {
      next.city = "Pilih kota/kabupaten";
    }

    if (!value.district) {
      next.district = "Pilih kecamatan";
    }

    if (!/^\d{5}$/.test(value.postalCode)) {
      next.postalCode = "Kode pos harus terdiri dari 5 digit";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // Parent dapat menggunakan validasi ini sebelum mengirim registrasi.
  // Validasi server tetap wajib dilakukan.
  return (
    <section className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">
        Informasi Kontak dan Alamat
      </h3>

      <div>
        <label htmlFor="register-phone" className="block text-sm font-medium text-gray-700">
          Nomor telepon *
        </label>
        <input
          id="register-phone"
          type="tel"
          autoComplete="tel"
          required
          disabled={disabled}
          value={value.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="08xxxxxxxxxx"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
        )}
      </div>

      <div>
        <label htmlFor="register-address" className="block text-sm font-medium text-gray-700">
          Alamat lengkap *
        </label>
        <textarea
          id="register-address"
          autoComplete="street-address"
          required
          rows={3}
          disabled={disabled}
          value={value.adress}
          onChange={(event) => updateField("adress", event.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="Nama jalan, nomor rumah, RT/RW"
        />
        {errors.adress && (
          <p className="mt-1 text-sm text-red-600">{errors.adress}</p>
        )}
      </div>

      <RegionSelector
        province={value.province}
        city={value.city}
        district={value.district}
        disabled={disabled}
        onChange={(regions) => {
          onChange({ ...value, ...regions });
          setErrors((current) => {
            const next = { ...current };
            delete next.province;
            delete next.city;
            delete next.district;
            return next;
          });
        }}
      />

      {(errors.province || errors.city || errors.district) && (
        <p className="text-sm text-red-600">
          {errors.province || errors.city || errors.district}
        </p>
      )}

      <div>
        <label htmlFor="register-postal-code" className="block text-sm font-medium text-gray-700">
          Kode pos *
        </label>
        <input
          id="register-postal-code"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          required
          disabled={disabled}
          value={value.postalCode}
          onChange={(event) =>
            updateField(
              "postalCode",
              event.target.value.replace(/\D/g, "").slice(0, 5)
            )
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="76114"
        />
        {errors.postalCode && (
          <p className="mt-1 text-sm text-red-600">{errors.postalCode}</p>
        )}
      </div>
    </section>
  );
}
