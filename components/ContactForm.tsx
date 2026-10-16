"use client";

import React, { useEffect, useState } from "react";

export interface CheckoutFormData {
  name: string;
  phone: string;
  email: string;
  adress: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  orderNotice: string;
}

interface CartModuleProps {
  checkoutForm: CheckoutFormData;
  setCheckoutForm: React.Dispatch<
    React.SetStateAction<CheckoutFormData>
  >;
  isSubmitting: boolean;
  makePurchase: () => Promise<void>;
}

interface Region {
  code: string;
  name: string;
}

interface RegionResponse {
  data: Region[];
  meta?: {
    administrative_area_level: number;
    updated_at: string;
  };
}

const REGION_API = "/api/regions";

const inputClass =
  "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-100";

const labelClass = "block text-sm font-medium text-gray-700";

export const ContactForm = ({
  checkoutForm,
  setCheckoutForm,
  isSubmitting,
  makePurchase,
}: CartModuleProps) => {
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);

  const [provinceCode, setProvinceCode] = useState("");
  const [cityCode, setCityCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [retryKey, setRetryKey] = useState(0);

  const updateForm = (
    field: keyof CheckoutFormData,
    value: string
  ) => {
    setCheckoutForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const fetchRegions = async (
    url: string,
    signal: AbortSignal
  ): Promise<Region[]> => {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Gagal mengambil data wilayah (${response.status})`);
    }

    const result: RegionResponse = await response.json();

    if (!Array.isArray(result.data)) {
      throw new Error("Format data wilayah tidak valid");
    }

    return result.data;
  };

  // 1. Provinsi: GET /api/provinces.json
  useEffect(() => {
  const controller = new AbortController();

  const load = async () => {
    setLoadingProvinces(true);

    try {
      const data = await fetchRegions(
        `${REGION_API}/provinces`,
        controller.signal
      );

      setProvinces(data);
      setErrors((previous) => {
        const next = { ...previous };
        delete next.province;
        return next;
      });
    } catch (error) {
      if (!controller.signal.aborted) {
        setErrors((previous) => ({
          ...previous,
          province:
            error instanceof Error
              ? error.message
              : "Gagal memuat provinsi",
        }));
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoadingProvinces(false);
      }
    }
  };

  void load();

  return () => controller.abort();
}, [retryKey]);

  // 2. Kabupaten/kota: GET /api/regencies/{PROVINCE_CODE}.json
  useEffect(() => {
    if (!provinceCode) {
      setCities([]);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoadingCities(true);

      try {
        const data = await fetchRegions(
          `${REGION_API}/regencies/${provinceCode}`,
          controller.signal
        );
        setCities(data);
        setErrors((previous) => {
          const next = { ...previous };
          delete next.city;
          return next;
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrors((previous) => ({
            ...previous,
            city:
              error instanceof Error
                ? error.message
                : "Gagal memuat kabupaten/kota",
          }));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCities(false);
        }
      }
    };

    load();
    return () => controller.abort();
  }, [provinceCode]);

  // 3. Kecamatan: GET /api/districts/{REGENCY_CODE}.json
  useEffect(() => {
    if (!cityCode) {
      setDistricts([]);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setLoadingDistricts(true);

      try {
        const data = await fetchRegions(
          `${REGION_API}/districts/${cityCode}`,
          controller.signal
        );
        setDistricts(data);
        setErrors((previous) => {
          const next = { ...previous };
          delete next.district;
          return next;
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setErrors((previous) => ({
            ...previous,
            district:
              error instanceof Error
                ? error.message
                : "Gagal memuat kecamatan",
          }));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDistricts(false);
        }
      }
    };

    load();
    return () => controller.abort();
  }, [cityCode]);

  const handleProvinceChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const code = event.target.value;
    const selected = provinces.find((item) => item.code === code);

    setProvinceCode(code);
    setCityCode("");
    setDistrictCode("");

    setCities([]);
    setDistricts([]);

    setCheckoutForm((previous) => ({
      ...previous,
      province: selected?.name ?? "",
      city: "",
      district: "",
    }));
  };

  const handleCityChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const code = event.target.value;
    const selected = cities.find((item) => item.code === code);

    setCityCode(code);
    setDistrictCode("");

    setDistricts([]);

    setCheckoutForm((previous) => ({
      ...previous,
      city: selected?.name ?? "",
      district: "",
    }));
  };

  const handleDistrictChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const code = event.target.value;
    const selected = districts.find((item) => item.code === code);

    setDistrictCode(code);

    setCheckoutForm((previous) => ({
      ...previous,
      district: selected?.name ?? "",
    }));
  };

  const handlePurchase = async () => {
    const nextErrors: Record<string, string> = {};

    if (!checkoutForm.adress.trim()) {
      nextErrors.adress = "Alamat lengkap wajib diisi";
    }
    if (!provinceCode || !checkoutForm.province) {
      nextErrors.province = "Pilih provinsi";
    }
    if (!cityCode || !checkoutForm.city) {
      nextErrors.city = "Pilih kota/kabupaten";
    }
    if (!districtCode || !checkoutForm.district) {
      nextErrors.district = "Pilih kecamatan";
    }
    if (!checkoutForm.postalCode.trim()) {
      nextErrors.postalCode = "Kode pos wajib diisi";
    } else if (!/^\d{5}$/.test(checkoutForm.postalCode)) {
      nextErrors.postalCode = "Kode pos harus terdiri dari 5 digit";
    }

    setErrors((previous) => {
      const regionErrors = {
        province: previous.province,
        city: previous.city,
        district: previous.district,
      };

      return { ...regionErrors, ...nextErrors };
    });

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await makePurchase();
  };

  const renderError = (field: string) =>
    errors[field] ? (
      <p className="mt-1 text-sm text-red-600">{errors[field]}</p>
    ) : null;

  return (
    <form
      className="px-4 sm:px-6 lg:col-start-1 lg:row-start-1 lg:px-0"
      onSubmit={(event) => {
        event.preventDefault();
        void handlePurchase();
      }}
    >
      <div className="mx-auto max-w-lg lg:max-w-none">
        <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="address" className={labelClass}>
              Alamat lengkap *
            </label>
            <input
              id="address"
              name="address"
              autoComplete="street-address"
              required
              disabled={isSubmitting}
              className={inputClass}
              placeholder="Nama jalan, nomor rumah, RT/RW"
              value={checkoutForm.adress}
              onChange={(event) => updateForm("adress", event.target.value)}
            />
            {renderError("adress")}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="province" className={labelClass}>
              Provinsi *
            </label>
            <select
              id="province"
              required
              disabled={isSubmitting || loadingProvinces}
              className={inputClass}
              value={provinceCode}
              onChange={handleProvinceChange}
            >
              <option value="">
                {loadingProvinces ? "Memuat provinsi..." : "Pilih provinsi"}
              </option>
              {provinces.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
            {renderError("province")}
          </div>

          <div>
            <label htmlFor="city" className={labelClass}>
              Kabupaten/Kota *
            </label>
            <select
              id="city"
              required
              disabled={isSubmitting || !provinceCode || loadingCities}
              className={inputClass}
              value={cityCode}
              onChange={handleCityChange}
            >
              <option value="">
                {!provinceCode
                  ? "Pilih provinsi terlebih dahulu"
                  : loadingCities
                    ? "Memuat kabupaten/kota..."
                    : "Pilih kabupaten/kota"}
              </option>
              {cities.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
            {renderError("city")}
          </div>

          <div>
            <label htmlFor="district" className={labelClass}>
              Kecamatan *
            </label>
            <select
              id="district"
              required
              disabled={isSubmitting || !cityCode || loadingDistricts}
              className={inputClass}
              value={districtCode}
              onChange={handleDistrictChange}
            >
              <option value="">
                {!cityCode
                  ? "Pilih kabupaten/kota terlebih dahulu"
                  : loadingDistricts
                    ? "Memuat kecamatan..."
                    : "Pilih kecamatan"}
              </option>
              {districts.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.name}
                </option>
              ))}
            </select>
            {renderError("district")}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="postal-code" className={labelClass}>
              Kode pos *
            </label>
            <input
              id="postal-code"
              name="postal-code"
              autoComplete="postal-code"
              inputMode="numeric"
              maxLength={5}
              pattern="[0-9]{5}"
              required
              disabled={isSubmitting}
              className={inputClass}
              placeholder="Contoh: 76114"
              value={checkoutForm.postalCode}
              onChange={(event) =>
                updateForm(
                  "postalCode",
                  event.target.value.replace(/\D/g, "").slice(0, 5)
                )
              }
            />
            {renderError("postalCode")}
          </div>
        </div>

        {Object.values(errors).some(Boolean) && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Periksa kembali data alamat yang wajib diisi.
            <button
              type="button"
              className="ml-2 font-semibold underline"
              onClick={() => setRetryKey((previous) => previous + 1)}
            >
              Muat ulang data provinsi
            </button>
          </div>
        )}

        <div className="mt-10 border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={
              isSubmitting ||
              loadingProvinces ||
              loadingCities ||
              loadingDistricts
            }
            className="w-full rounded-md border border-transparent bg-[#02054b] px-6 py-3 text-lg font-medium text-white shadow-sm hover:bg-[#01043D] focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSubmitting ? "Memproses..." : "Order Sekarang"}
          </button>
        </div>
      </div>
    </form>
  );
};
