
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
    <div>
      <h3 className="mb-2 text-2xl">Filters</h3>
      <div className="divider" />

      <div className="flex flex-col gap-y-1">
        <h3 className="mb-2 text-xl">Availability</h3>

        <div className="form-control">
          <label className="flex cursor-pointer items-center">
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
              className="checkbox accent-purple-500"
            />
            <span className="label-text ml-2 text-lg text-black">
              Tersedia
            </span>
          </label>
        </div>

        <div className="form-control">
          <label className="flex cursor-pointer items-center">
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
              className="checkbox accent-purple-500"
            />
            <span className="label-text ml-2 text-lg text-black">
              Tidak Tersedia
            </span>
          </label>
        </div>
      </div>

      <div className="divider" />

      <div className="flex flex-col gap-y-1">
        <h3 className="mb-2 text-xl">Harga</h3>

        <input
          type="range"
          min={0}
          max={100000000}
          step={10}
          value={inputCategory.priceFilter.value}
          className="range accent-purple-500"
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

        <span>
          {`Maksimal Harga: ${formatRupiah(inputCategory.priceFilter.value)}`}
        </span>
      </div>

      <div className="divider" />

      {/* <div>
        <h3 className="mb-2 text-xl">Minimum Rating:</h3>

        <input
          type="range"
          min={0}
          max={5}
          value={inputCategory.ratingFilter.value}
          onChange={(e) =>
            setInputCategory((prev) => ({
              ...prev,
              ratingFilter: {
                ...prev.ratingFilter,
                value: Number(e.target.value),
              },
            }))
          }
          className="range range-info"
          step={1}
        />

        <div className="flex w-full justify-between px-2 text-xs">
          {[0, 1, 2, 3, 4, 5].map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
      </div> */}

      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleApplyFilters}
          disabled={isApplying}
          className="btn w-full border-0 bg-[#02054b] text-white hover:bg-[#15195c] disabled:opacity-60"
        >
          Apply Filters
        </button>

        <button
          type="button"
          onClick={() => {
            setInputCategory(DEFAULT_FILTERS);
          }}
          className="btn btn-outline w-full"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};

export default Filters;
