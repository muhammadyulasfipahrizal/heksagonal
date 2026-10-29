// *********************
// Role of the component: Topbar of the header
// Name of the component: HeaderTop.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <HeaderTop />
// Input parameters: no input parameters
// Output: topbar with phone, email and login and register links
// *********************

"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";
import toast from "react-hot-toast";
import { FaHeadphones } from "react-icons/fa6";
import { FaRegEnvelope } from "react-icons/fa6";
import { FaLocationDot } from "react-icons/fa6";
import { FaRegUser } from "react-icons/fa6";

const HeaderTop = () => {
  const { data: session }: any = useSession();

  const handleLogout = () => {
    setTimeout(() => signOut(), 1000);
    toast.success("Logout successful!");
  }
  return (
    <div className="bg-[#02054b] text-white">
      <div
        className="
          mx-auto flex max-w-screen-2xl flex-col
          items-center justify-center gap-2
          px-3 py-3
          sm:px-5
          lg:h-10 lg:flex-row lg:justify-between lg:gap-4 lg:px-8 lg:py-0
          xl:px-12
        "
      >
        {/* Contact Information */}
        <ul
          className="
            flex w-full flex-wrap items-center justify-center
            gap-x-4 gap-y-2 text-xs
            sm:gap-x-6 sm:text-sm
            lg:w-auto lg:justify-start lg:gap-x-5
          "
        >
          <li className="flex items-center gap-2 font-semibold">
            <FaHeadphones className="shrink-0 text-white" />
            <a
              href="tel:+6281649528478"
              className="whitespace-nowrap transition-colors hover:text-amber-300"
            >
              +62 816-495-284-78
            </a>
          </li>

          <li className="flex min-w-0 items-center gap-2 font-semibold">
            <FaRegEnvelope className="shrink-0 text-lg text-white" />
            <a
              href="mailto:heksagonal@gmail.com"
              className="break-all transition-colors hover:text-amber-300 sm:break-normal"
            >
              heksagonal@gmail.com
            </a>
          </li>
        </ul>

        {/* Authentication */}
        <ul
          className="
            flex w-full items-center justify-center
            gap-x-5 text-xs font-semibold
            sm:gap-x-6 sm:text-sm
            lg:w-auto lg:justify-end lg:gap-x-5
          "
        >
          {!session ? (
            <>
              <li className="flex items-center">
                <Link
                  href="/login"
                  className="inline-flex min-h-8 items-center gap-2 transition-colors hover:text-amber-300"
                >
                  <FaRegUser className="shrink-0" />
                  <span>Login</span>
                </Link>
              </li>

              <li className="flex items-center">
                <Link
                  href="/register"
                  className="inline-flex min-h-8 items-center gap-2 transition-colors hover:text-amber-300"
                >
                  <FaRegUser className="shrink-0" />
                  <span>Register</span>
                </Link>
              </li>
            </>
          ) : (
            <>
              <li className="min-w-0 max-w-[180px] sm:max-w-[240px] lg:max-w-[200px]">
                <span
                  className="block truncate text-xs sm:text-sm"
                  title={session.user?.email ?? ""}
                >
                  {session.user?.email}
                </span>
              </li>

              <li className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={() => handleLogout()}
                  className="inline-flex min-h-8 items-center gap-2 transition-colors hover:text-amber-300"
                >
                  <FaRegUser className="shrink-0" />
                  <span>Log out</span>
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
};

export default HeaderTop;
