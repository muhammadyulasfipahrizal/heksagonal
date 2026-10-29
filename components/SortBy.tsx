// *********************
// Role of the component: SortBy
// Name of the component: SortBy.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <SortBy />
// Input parameters: no input parameters
// Output: select input with options for sorting by a-z, z-a, price low, price high
// *********************

"use client";
import React, { useState } from "react";
import { useSortStore } from "@/app/_zustand/sortStore";
import { FaSortAmountDown, FaTimes } from "react-icons/fa";

const SortBy = () => {
  // getting values from Zustand sort store
  const { sortBy, changeSortBy } = useSortStore();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full min-w-0 lg:w-auto">
      {/* Tombol sortir untuk mobile */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex min-h-11 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-[#02054b] md:hidden"
      >
        <span className="flex items-center gap-2">
          <FaSortAmountDown aria-hidden="true" />
          Urutkan Produk
        </span>

        {isOpen ? (
          <FaTimes aria-hidden="true" />
        ) : (
          <span className="text-xs text-gray-500">Buka</span>
        )}
      </button>

      {/* Mobile: select mengikuti tombol. Desktop: selalu tampil */}
      <div
        className={`${isOpen ? "mt-3 block" : "hidden"} md:mt-0 md:block`}>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 lg:w-auto">
          <label
            htmlFor="shop-sort"
            className="hidden shrink-0 text-sm font-medium text-gray-700 lg:block"
          >
            Sort by:
          </label>

          <select
            id="shop-sort"
            value={sortBy}
            onChange={(e) => {
              changeSortBy(e.target.value);
              setIsOpen(false);
            }}
            className="select select-bordered min-h-11 w-full border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-[#02054b] focus:outline-none lg:w-52"
            name="sort"
          >
            <option value="defaultSort">Default</option>
            <option value="titleAsc">Sort A-Z</option>
            <option value="titleDesc">Sort Z-A</option>
            <option value="lowPrice">Lowest Price</option>
            <option value="highPrice">Highest Price</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SortBy;
