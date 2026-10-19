
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
    <div className="join flex justify-center py-16">
      <button
        className="join-item btn btn-lg bg-[#02054b] text-white hover:bg-white hover:text-[#02054b] disabled:opacity-50"
        onClick={() => changePage(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Previous page"
      >
        «
      </button>

      <button
        type="button"
        className="join-item btn btn-lg bg-[#02054b] text-white hover:bg-white hover:text-[#02054b]"
      >
        Page {currentPage}
      </button>

      <button
        className="join-item btn btn-lg bg-[#02054b] text-white hover:bg-white hover:text-[#02054b]"
        onClick={() => changePage(currentPage + 1)}
        aria-label="Next page"
      >
        »
      </button>
    </div>
  );
};

export default Pagination;
