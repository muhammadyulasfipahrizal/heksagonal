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
};

const WishItem = ({
  id,
  title,
  price,
  image,
  slug,
  stockAvailabillity,
}: WishItemProps) => {
  const { data: session, status } = useSession();
  const { removeFromWishlist } = useWishlistStore();
  const [loading, setLoading] = useState(false);

  console.log("wishlist price", price);

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

  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price);

  return (
    <tr className="border-b border-gray-100">
      <td className="w-12 text-center">
        <button
          type="button"
          onClick={handleRemove}
          disabled={loading}
          aria-label={`Remove ${title} from wishlist`}
          title="Remove from wishlist"
          className="rounded-md px-2 py-1 text-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          {loading ? "…" : "×"}
        </button>
      </td>

      <td className="min-w-24 py-4">
        <Link
          href={`/product/${slug}`}
          className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-gray-50"
        >
          {image ? (
            <Image
              src={getImageSrc(image)}
              alt={title}
              width={80}
              height={80}
              className="h-full w-full object-contain"
              unoptimized
            />
          ) : (
            <span className="text-xs text-gray-400">No image</span>
          )}
        </Link>
      </td>

      <td className="min-w-40 px-3 py-4 text-left">
        <Link
          href={`/product/${slug}`}
          className="font-medium text-gray-800 transition-colors hover:text-[#02054b]"
        >
          {title}
        </Link>

        <p className="mt-1 text-sm text-gray-500">{formattedPrice}</p>
      </td>

      <td className="min-w-32 px-3 py-4">
        {stockAvailabillity > 0 ? (
          <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
            In Stock
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
            Out of Stock
          </span>
        )}
      </td>

      <td className="min-w-32 px-3 py-4">
        <Link
          href={`/product/${slug}`}
          className="inline-flex rounded-lg bg-[#02054b] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#10166b]"
        >
          View Product
        </Link>
      </td>
    </tr>
  );
};

export default WishItem;