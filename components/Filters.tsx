
"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSortStore } from "@/app/_zustand/sortStore";
import { usePaginationStore } from "@/app/_zustand/paginationStore";
import { formatRupiah } from "@/lib/sanitize";

interface InputCategory {
  inStock: { text: string; isChecked: boolean };
  outOfStock: { text: string; isChecked: boolean };
  priceFilter: { text: string; value: number };
  ratingFilter: { text: string; value: number };
}

const DEFAULT_FILTERS: InputCategory = {
  inStock: { text: "instock", isChecked: true },
  outOfStock: { text: "outofstock", isChecked: true },
  priceFilter: { text: "price", value: 100000000 },
  ratingFilter: { text: "rating", value: 0 },
};

const Filters = () => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { page } = usePaginationStore();
  const { sortBy } = useSortStore();

  const [inputCategory, setInputCategory] =
    useState<InputCategory>(DEFAULT_FILTERS);

  const [isApplying, setIsApplying] = useState(false);

  // Initialize filter controls from the current URL.
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    const price = Number(params.get("price"));
    const rating = Number(params.get("rating"));

    setInputCategory({
      inStock: {
        text: "instock",
        isChecked: params.get("inStock") !== "false",
      },
      outOfStock: {
        text: "outofstock",
        isChecked: params.get("outOfStock") !== "false",
      },
      priceFilter: {
        text: "price",
        value:
          params.has("price") && Number.isFinite(price) && price >= 0
            ? price
            : 100000000,
      },
      ratingFilter: {
        text: "rating",
        value:
          params.has("rating") &&
          Number.isFinite(rating) &&
          rating >= 0 &&
          rating <= 5
            ? rating
            : 0,
      },
    });
  }, [searchParams]);

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    // Preserve categoryId and any other existing parameters.
    params.set("inStock", String(inputCategory.inStock.isChecked));
    params.set("outOfStock", String(inputCategory.outOfStock.isChecked));
    params.set("price", String(inputCategory.priceFilter.value));
    params.set("rating", String(inputCategory.ratingFilter.value));
    params.set("sort", sortBy);
    params.set("page", "1");

    // Reset pagination when filters change.
    router.push(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <div className="min-w-0">
      <h3 className="text-lg font-bold sm:text-xl">
        Filters
      </h3>

      <div className="my-3 border-t border-gray-200" />

      {/* Availability */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-semibold text-gray-900 sm:text-base">
          Availability
        </h4>

        <label className="flex min-h-8 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={inputCategory.inStock.isChecked}
            onChange={() =>
              setInputCategory((prev) => ({
                ...prev,
                inStock: {
                  ...prev.inStock,
                  isChecked: !prev.inStock.isChecked,
                },
              }))
            }
            className="checkbox checkbox-sm rounded accent-purple-500"
          />
          <span className="text-sm text-gray-700">Tersedia</span>
        </label>

        <label className="flex min-h-8 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={inputCategory.outOfStock.isChecked}
            onChange={() =>
              setInputCategory((prev) => ({
                ...prev,
                outOfStock: {
                  ...prev.outOfStock,
                  isChecked: !prev.outOfStock.isChecked,
                },
              }))
            }
            className="checkbox checkbox-sm rounded accent-purple-500"
          />
          <span className="text-sm text-gray-700">Tidak Tersedia</span>
        </label>
      </div>

      <div className="my-4 border-t border-gray-200 sm:my-5" />

      {/* Price */}
      <div className="flex min-w-0 flex-col gap-3">
        <h4 className="text-sm font-semibold text-gray-900 sm:text-base">
          Harga
        </h4>

        <input
          type="range"
          min={0}
          max={100000000}
          step={10}
          value={inputCategory.priceFilter.value}
          className="range range-sm accent-purple-500"
          onChange={(e) =>
            setInputCategory((prev) => ({
              ...prev,
              priceFilter: {
                ...prev.priceFilter,
                value: Number(e.target.value),
              },
            }))
          }
        />

        <p className="break-words text-sm leading-6 text-gray-600">
          Maksimal harga:{" "}
          <span className="font-semibold text-gray-900">
            {formatRupiah(inputCategory.priceFilter.value)}
          </span>
        </p>
      </div>

      <div className="my-4 border-t border-gray-200 sm:my-5" />

      {/* Actions */}
      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleApplyFilters}
          disabled={isApplying}
          className="btn min-h-11 w-full border-0 bg-[#02054b] text-sm text-white shadow-none hover:bg-[#15195c] disabled:opacity-60"
        >
          {isApplying ? "Menerapkan..." : "Apply Filters"}
        </button>

        <button
          type="button"
          onClick={() => setInputCategory(DEFAULT_FILTERS)}
          className="btn min-h-11 w-full border border-gray-300 bg-white text-sm text-gray-800 shadow-none hover:border-gray-400 hover:bg-gray-50"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default Filters;
