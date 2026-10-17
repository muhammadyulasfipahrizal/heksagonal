
"use client";

import { useEffect, useState } from "react";

interface Region {
  code: string;
  name: string;
}

interface RegionResponse {
  data: Region[];
}

interface RegionSelectorProps {
  province: string;
  city: string;
  district: string;
  onChange: (values: {
    province: string;
    city: string;
    district: string;
  }) => void;
  disabled?: boolean;
}

const REGION_API = "/api/regions";
const selectClass =
  "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100";

export default function RegionSelector({
  province,
  city,
  district,
  onChange,
  disabled = false,
}: RegionSelectorProps) {
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);

  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [error, setError] = useState("");

  const provinceCode =
    provinces.find((item) => item.name === province)?.code ?? "";

  const cityCode =
    cities.find((item) => item.name === city)?.code ?? "";

  const fetchRegions = async (
    url: string,
    signal: AbortSignal
  ): Promise<Region[]> => {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Gagal mengambil data wilayah (${response.status})`);
    }

    const result = (await response.json()) as RegionResponse;

    if (!Array.isArray(result.data)) {
      throw new Error("Format data wilayah tidak valid.");
    }

    return result.data;
  };

  // Muat provinsi.
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoadingProvinces(true);
      setError("");

      try {
        const result = await fetchRegions(
          `${REGION_API}/provinces`,
          controller.signal
        );
        setProvinces(result);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : "Gagal memuat provinsi."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingProvinces(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, []);

  // Muat kota berdasarkan provinsi yang dipilih.
  useEffect(() => {
    const controller = new AbortController();

    setCities([]);
    setDistricts([]);

    if (!provinceCode) {
      setLoadingCities(false);
      return () => controller.abort();
    }

    async function load() {
      setLoadingCities(true);

      try {
        const result = await fetchRegions(
          `${REGION_API}/regencies/${provinceCode}`,
          controller.signal
        );
        setCities(result);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : "Gagal memuat kota."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingCities(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [provinceCode]);

  // Muat kecamatan berdasarkan kota yang dipilih.
  useEffect(() => {
    const controller = new AbortController();
    setDistricts([]);

    if (!cityCode) {
      setLoadingDistricts(false);
      return () => controller.abort();
    }

    async function load() {
      setLoadingDistricts(true);

      try {
        const result = await fetchRegions(
          `${REGION_API}/districts/${cityCode}`,
          controller.signal
        );
        setDistricts(result);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err instanceof Error ? err.message : "Gagal memuat kecamatan."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingDistricts(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [cityCode]);

  // Bersihkan error ketika pengguna mengganti pilihan wilayah.
  function handleProvinceChange(code: string) {
    const selected = provinces.find((item) => item.code === code);
    setError("");

    onChange({
      province: selected?.name ?? "",
      city: "",
      district: "",
    });
  }

  function handleCityChange(code: string) {
    const selected = cities.find((item) => item.code === code);
    setError("");

    onChange({
      province,
      city: selected?.name ?? "",
      district: "",
    });
  }

  function handleDistrictChange(code: string) {
    const selected = districts.find((item) => item.code === code);
    setError("");

    onChange({
      province,
      city,
      district: selected?.name ?? "",
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="block text-sm font-medium text-gray-700">
        Provinsi *
        <select
          required
          disabled={disabled || loadingProvinces}
          className={selectClass}
          value={provinceCode}
          onChange={(event) => handleProvinceChange(event.target.value)}
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
      </label>

      <label className="block text-sm font-medium text-gray-700">
        Kota/Kabupaten *
        <select
          required
          disabled={disabled || !provinceCode || loadingCities}
          className={selectClass}
          value={cityCode}
          onChange={(event) => handleCityChange(event.target.value)}
        >
          <option value="">
            {!provinceCode
              ? "Pilih provinsi terlebih dahulu"
              : loadingCities
                ? "Memuat kota/kabupaten..."
                : "Pilih kota/kabupaten"}
          </option>
          {cities.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
        Kecamatan *
        <select
          required
          disabled={disabled || !cityCode || loadingDistricts}
          className={selectClass}
          value={districts.find((item) => item.name === district)?.code ?? ""}
          onChange={(event) => handleDistrictChange(event.target.value)}
        >
          <option value="">
            {!cityCode
              ? "Pilih kota/kabupaten terlebih dahulu"
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
      </label>

      {error && (
        <div className="sm:col-span-2">
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
          <button
            type="button"
            className="mt-1 text-sm font-medium text-blue-600 hover:underline"
            onClick={() => window.location.reload()}
          >
            Muat ulang halaman
          </button>
        </div>
      )}
    </div>
  );
}
