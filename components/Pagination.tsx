
"use client";

import React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PaginationProps = {
  currentPage: number;
};

const Pagination = ({ currentPage }: PaginationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const changePage = (nextPage: number) => {
    if (nextPage < 1) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));

    router.push(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <nav
      aria-label="Pagination produk"
      className="flex justify-center py-8 sm:py-12 lg:py-16"
    >
      <div className="join">
        <button
          type="button"
          className="join-item btn btn-md min-h-11 min-w-11 border-[#02054b] bg-[#02054b] px-3 text-white hover:bg-white hover:text-[#02054b] disabled:cursor-not-allowed disabled:opacity-40 sm:btn-lg"
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Halaman sebelumnya"
        >
          «
        </button>

        <button
          type="button"
          aria-current="page"
          className="join-item btn btn-md min-h-11 border-[#02054b] bg-[#02054b] px-4 text-white hover:bg-[#15195c] sm:btn-lg"
          disabled
        >
          Halaman {currentPage}
        </button>

        <button
          type="button"
          className="join-item btn btn-md min-h-11 min-w-11 border-[#02054b] bg-[#02054b] px-3 text-white hover:bg-white hover:text-[#02054b] sm:btn-lg"
          onClick={() => changePage(currentPage + 1)}
          aria-label="Halaman berikutnya"
        >
          »
        </button>
      </div>
    </nav>
  );
};

export default Pagination;
