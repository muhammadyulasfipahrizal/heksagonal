"use client";

import { useState } from "react";
import { FaFilter, FaTimes } from "react-icons/fa";

type FilterToggleProps = {
  children: React.ReactNode;
};

export default function FilterToggle({ children }: FilterToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="mb-3 flex min-h-11 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-[#02054b] lg:hidden"
      >
        <span className="flex items-center gap-2">
          <FaFilter aria-hidden="true" />
          Filter Produk
        </span>

        {isOpen ? (
          <FaTimes aria-hidden="true" />
        ) : (
          <span className="text-xs text-gray-500">Buka</span>
        )}
      </button>

      <div
        className={`${
          isOpen ? "block" : "hidden"
        } rounded-xl border border-gray-200 p-4 lg:block lg:rounded-none lg:border-0 lg:p-0`}
      >
        {children}
      </div>
    </div>
  );
}