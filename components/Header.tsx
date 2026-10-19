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
import { FaBell } from "react-icons/fa6";

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
      {pathname.startsWith("/admin") === false && (
        <div className="h-32 bg-white flex items-center justify-between px-16 max-[1320px]:px-16 max-md:px-6 max-lg:flex-col max-lg:gap-y-7 max-lg:justify-center max-lg:h-60 max-w-screen-2xl mx-auto">
          <Link href="/">
            <img src="/logo_heksagonal.png" width={300} height={300} alt="heksagonal logo" className="relative right-5 max-[1023px]:w-56" />
          </Link>
          <button
            type="button"
            onClick={() => setIsCategoryOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 font-medium text-gray-700 transition hover:border-blue-600 hover:bg-blue-50"
          >
            <span className="text-xl">☰</span>
            <span>Kategori</span>
          </button>

          <SearchInput />
          <div className="flex gap-x-10 items-center">
            <NotificationBell />
            {status === "authenticated" && (
              <div className="flex flex-row gap-x-10">
                <HeartElement wishQuantity={wishQuantity} />

                <Link
                  href="/profile"
                  aria-label="Profile"
                  title="Profile"
                  className={`flex items-center justify-center rounded-full p-2 transition hover:bg-blue-50 hover:text-blue-700 ${
                    pathname.startsWith("/profile")
                      ? "text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  Profile
                </Link>
              </div>
              
            )}
            <CartElement />
          </div>
          <CategoryHeader
            isOpen={isCategoryOpen}
            onClose={() => setIsCategoryOpen(false)}
          />
        </div>
      )}
      {pathname.startsWith("/admin") === true && (
        <div className="flex justify-between h-32 bg-white items-center px-16 max-[1320px]:px-10  max-w-screen-2xl mx-auto max-[400px]:px-5">
          <Link href="/">
            <Image
              src="/logo_heksagonal.png"
              width={130}
              height={130}
              alt="heksagonal logo"
              className="w-56 h-auto"
            />
          </Link>
          <div className="flex gap-x-5 items-center">
            <NotificationBell />
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="w-10">
                <Image
                  src="/randomuser.jpg"
                  alt="random profile photo"
                  width={30}
                  height={30}
                  className="w-full h-full rounded-full"
                />
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li>
                  <Link href="/admin">Dashboard</Link>
                </li>
                <li>
                  <a>Profile</a>
                </li>
                <li onClick={handleLogout}>
                  <a href="#">Logout</a>
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
