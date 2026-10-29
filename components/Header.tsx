// *********************
// Role of the component: Header component
// Name of the component: Header.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <Header />
// Input parameters: no input parameters
// Output: Header component
// *********************

"use client";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import HeaderTop from "./HeaderTop";
import Image from "next/image";
import SearchInput from "./SearchInput";
import Link from "next/link";
import { FaUser, FaBoxOpen } from "react-icons/fa";

import CartElement from "./CartElement";
import NotificationBell from "./NotificationBell";
import HeartElement from "./HeartElement";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import apiClient from "@/lib/api";
import CategoryHeader from "./CategoryHeader";

const Header = () => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const { wishlist, setWishlist, wishQuantity } = useWishlistStore();

  const handleLogout = () => {
    setTimeout(() => signOut(), 1000);
    toast.success("Logout successful!");
  };

  // getting all wishlist items by user id
  const getWishlistByUserId = async (id: string) => {
    const response = await apiClient.get(
      `/api/wishlist/${encodeURIComponent(id)}`,
      { cache: "no-store" }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result?.message || "Failed to fetch wishlist.");
    }

    // Backend mengembalikan { message, total, wishlist }.
    const items = Array.isArray(result)
      ? result
      : Array.isArray(result?.wishlist)
        ? result.wishlist
        : [];

    const productArray = items
      .filter((item: any) => item?.product?.id)
      .map((item: any) => ({
        id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        image: item.product.mainImage,
        slug: item.product.slug,
        stockAvailabillity: item.product.inStock,
      }));

    setWishlist(productArray);
  };

  // getting user by email so I can get his user id
  const getUserByEmail = async () => {
    if (session?.user?.email) {
      
      apiClient.get(`/api/users/email/${session?.user?.email}`, {
        cache: "no-store",
      })
        .then((response) => response.json())
        .then((data) => {
          getWishlistByUserId(data?.id);
        });
    }
  };

  useEffect(() => {
    getUserByEmail();
  }, [session?.user?.email, wishlist.length]);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  return (
    <header className="bg-white">
      <HeaderTop />

      {/* =========================
          CUSTOMER HEADER
      ========================== */}
      {!pathname.startsWith("/admin") && (
        <div className="mx-auto max-w-screen-2xl bg-white">
          <div
            className="
              flex flex-col gap-4
              px-3 py-4 lg:mt-4
              sm:gap-5 sm:px-6 sm:py-5
              lg:flex-row lg:items-center lg:justify-between
              lg:gap-5 lg:px-8 lg:py-0
              xl:px-12
            "
          >
            {/* Logo + Cart - Mobile Top Row */}
            <div className="flex w-full items-center justify-between gap-3 lg:w-auto lg:shrink-0">
              <Link
                href="/"
                aria-label="HEKSAGONAL - Beranda"
                className="inline-flex min-w-0 items-center"
              >
                <Image
                  src="/logo_heksagonal.png"
                  width={300}
                  height={100}
                  alt="HEKSAGONAL"
                  priority
                  className="
                    h-auto w-40 object-contain
                    sm:w-48
                    lg:w-52
                    xl:w-60
                  "
                />
              </Link>

              {/* Cart on mobile */}
              <div className="flex shrink-0 items-center lg:hidden">
                <CartElement />
              </div>
            </div>

            {/* Search */}
            <div className="w-full min-w-0 lg:flex-1">
              <SearchInput />
            </div>

            {/* Navigation + Actions */}
            <div
              className="
                flex w-full min-w-0 flex-wrap
                items-center justify-between gap-3
                lg:w-auto lg:shrink-0 lg:justify-end lg:gap-4
                xl:gap-5
              "
            >
              {/* Category Button */}
              <button
                type="button"
                onClick={() => setIsCategoryOpen(true)}
                aria-label="Buka kategori produk"
                className="
                  inline-flex min-h-10 shrink-0
                  items-center justify-center gap-2
                  rounded-lg border border-gray-200
                  px-3 py-2 text-sm font-semibold
                  text-gray-700 transition
                  hover:border-blue-600 hover:bg-blue-50
                  focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-blue-500
                  sm:px-4
                "
              >
                <span aria-hidden="true" className="text-lg">
                  ☰
                </span>
                <span>Kategori</span>
              </button>

              {/* User Actions */}
              <div
                className="
                  flex min-w-0 flex-1 flex-wrap
                  items-center justify-end gap-2
                  sm:gap-3
                  lg:flex-none lg:gap-3
                  xl:gap-3
                "
              >
                <NotificationBell />

                {status === "authenticated" && (
                  <>
                    <HeartElement wishQuantity={wishQuantity} />

                    {/* Profile */}
                    <Link
                      href="/profile"
                      aria-label="Profile"
                      title="Profile"
                      className={`
                        inline-flex size-10 shrink-0 items-center justify-center
                        rounded-lg transition-colors
                        hover:bg-blue-50 hover:text-blue-700
                        ${
                          pathname.startsWith("/profile")
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700"
                        }
                      `}
                    >
                      <FaUser className="size-5" aria-hidden="true" />
                    </Link>

                    {/* My Orders */}
                    <Link
                      href="/orders"
                      aria-label="My Orders"
                      title="My Orders"
                      className={`
                        inline-flex size-10 shrink-0 items-center justify-center
                        rounded-lg transition-colors
                        hover:bg-blue-50 hover:text-blue-700
                        ${
                          pathname.startsWith("/orders")
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700"
                        }
                      `}
                    >
                      <FaBoxOpen className="size-6" aria-hidden="true" />
                    </Link>
                  </>
                )}

                {/* Cart on tablet and desktop */}
                <div className="hidden shrink-0 items-center lg:flex">
                  <CartElement />
                </div>
              </div>
              </div>
            </div>

            {/* Category Modal / Drawer */}
            <CategoryHeader
              isOpen={isCategoryOpen}
              onClose={() => setIsCategoryOpen(false)}
            />
          </div>
      )}

      {/* =========================
          ADMIN HEADER
      ========================== */}
      {pathname.startsWith("/admin") && (
        <div
          className="
            mx-auto flex min-h-20 max-w-screen-2xl
            items-center justify-between gap-4
            bg-white px-4 py-4
            sm:px-6 sm:py-5
            lg:min-h-32 lg:px-10
            xl:px-16
          "
        >
          {/* Admin Logo */}
          <Link
            href="/"
            aria-label="HEKSAGONAL - Beranda"
            className="inline-flex min-w-0 items-center"
          >
            <Image
              src="/logo_heksagonal.png"
              width={300}
              height={100}
              alt="HEKSAGONAL"
              priority
              className="
                h-auto w-36 object-contain
                sm:w-44
                lg:w-56
              "
            />
          </Link>

          {/* Admin Actions */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <NotificationBell />

            <div className="dropdown dropdown-end">
              <button
                type="button"
                tabIndex={0}
                aria-label="Buka menu akun admin"
                className="
                  flex h-10 w-10 items-center justify-center
                  overflow-hidden rounded-full
                  ring-2 ring-transparent transition
                  hover:ring-blue-500
                  focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-blue-500
                  sm:h-11 sm:w-11
                "
              >
                <Image
                  src="/randomuser.jpg"
                  alt="Foto profil admin"
                  width={44}
                  height={44}
                  className="h-full w-full object-cover"
                />
              </button>

              <ul
                tabIndex={0}
                className="
                  menu dropdown-content z-50 mt-3
                  w-52 rounded-xl border border-gray-100
                  bg-base-100 p-2 shadow-xl
                "
              >
                <li>
                  <Link href="/admin">Dashboard</Link>
                </li>

                <li>
                  <Link href="/#">Profile</Link>
                </li>

                <li>
                  <button
                    type="button"
                    onClick={() => handleLogout()}
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
