"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import apiClient from "@/lib/api";
import { getImageSrc } from "@/lib/utils";

type WishItemProps = {
  id: string;
  title: string;
  price: number;
  image: string;
  slug: string;
  stockAvailabillity: number;
  view: "mobile" | "desktop";
};

const WishItem = ({
  id,
  title,
  price,
  image,
  slug,
  stockAvailabillity,
  view,
}: WishItemProps) => {
  const { data: session, status } = useSession();
  const { removeFromWishlist } = useWishlistStore();
  const [loading, setLoading] = useState(false);

  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(price ?? 0));

  const inStock = stockAvailabillity > 0;

  const handleRemove = async () => {
    if (loading) return;

    if (status !== "authenticated" || !session?.user?.email) {
      toast.error("Please log in to manage your wishlist.");
      return;
    }

    try {
      setLoading(true);

      const userResponse = await apiClient.get(
        `/api/users/email/${encodeURIComponent(session.user.email)}`,
        { cache: "no-store" }
      );

      if (!userResponse.ok) {
        throw new Error("Unable to retrieve your account.");
      }

      const userData = await userResponse.json();

      if (!userData?.id) {
        throw new Error("User account was not found.");
      }

      const response = await apiClient.delete(
        `/api/wishlist/${encodeURIComponent(userData.id)}/${encodeURIComponent(id)}`
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.message || "Failed to remove product from wishlist."
        );
      }

      removeFromWishlist(id);
      toast.success(result?.message || "Product removed from wishlist.");
    } catch (error) {
      console.error("Remove wishlist item error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  const removeButton = (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      aria-label={`Remove ${title} from wishlist`}
      title="Remove from wishlist"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <span className="text-sm">…</span>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 7h12m-10 0 .7 13h6.6L16 7M9 7V4h6v3m-5 4v5m4-5v5"
          />
        </svg>
      )}
    </button>
  );

  const productImage = (
    <Link
      href={`/product/${slug}`}
      aria-label={`View ${title}`}
      className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 sm:h-28 sm:w-28"
    >
      {image ? (
        <Image
          src={getImageSrc(image)}
          alt={title}
          width={112}
          height={112}
          sizes="(max-width: 640px) 96px, 112px"
          className="h-full w-full object-contain p-2"
          unoptimized
        />
      ) : (
        <span className="px-2 text-center text-xs text-gray-400">
          No image available
        </span>
      )}
    </Link>
  );

  const stockBadge = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        inStock
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          inStock ? "bg-green-500" : "bg-red-500"
        }`}
      />
      {inStock ? "In Stock" : "Out of Stock"}
    </span>
  );

  const productLink = (
    <Link
      href={`/product/${slug}`}
      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#02054b] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#10166b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02054b] focus-visible:ring-offset-2"
    >
      View Product
    </Link>
  );

  if (view === "mobile") {
    return (
      <article className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md sm:p-4">
        <div className="flex gap-3 sm:gap-4">
          {productImage}

          <div className="min-w-0 flex-1 py-1">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/product/${slug}`}
                className="line-clamp-2 text-sm font-semibold leading-5 text-gray-800 transition-colors hover:text-[#02054b] sm:text-base"
              >
                {title}
              </Link>

              {removeButton}
            </div>

            <p className="mt-2 text-base font-bold text-[#02054b] sm:text-lg">
              {formattedPrice}
            </p>

            <div className="mt-2">{stockBadge}</div>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500">
              Product details
            </span>
            {productLink}
          </div>
        </div>
      </article>
    );
  }

  return (
    <tr className="transition-colors hover:bg-gray-50/80">
      <td className="px-4 py-4 text-center">{removeButton}</td>

      <td className="px-4 py-4">{productImage}</td>

      <td className="px-4 py-4">
        <Link
          href={`/product/${slug}`}
          className="line-clamp-2 font-semibold text-gray-800 transition-colors hover:text-[#02054b]"
        >
          {title}
        </Link>
        <p className="mt-1.5 font-semibold text-[#02054b]">
          {formattedPrice}
        </p>
      </td>

      <td className="px-4 py-4">{stockBadge}</td>

      <td className="px-4 py-4">{productLink}</td>
    </tr>
  );
};

export default WishItem;