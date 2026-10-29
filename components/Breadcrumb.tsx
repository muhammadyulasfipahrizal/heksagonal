// *********************
// Role of the component: Component that displays current page location in the application 
// Name of the component: Breadcrumb.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Breadcrumb />
// Input parameters: No input parameters
// Output: Page location in the application
// *********************

import Link from "next/link";
import React from "react";
import { FaHouse } from "react-icons/fa6";

const Breadcrumb = () => {
  return (
    <nav
      aria-label="Breadcrumb"
      className="breadcrumbs py-4 text-xs text-gray-500 sm:py-5 sm:text-sm md:pb-8"
    >
      <ul className="flex flex-wrap items-center gap-y-1">
        <li>
          <Link
            href="/"
            className="inline-flex items-center gap-2 hover:text-[#02054b]"
          >
            <FaHouse aria-hidden="true" />
            <span>Home</span>
          </Link>
        </li>

        <li>
          <Link href="/shop" className="hover:text-[#02054b]">
            Shop
          </Link>
        </li>

        <li>
          <span aria-current="page" className="break-words">
            Product
          </span>
        </li>
      </ul>
    </nav>
  );
};

export default Breadcrumb;
