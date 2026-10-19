"use client";

import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import WishItem from "@/components/WishItem";
import apiClient from "@/lib/api";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export const WishlistModule = () => {
  const { data: session, status } = useSession();
  const { wishlist, setWishlist } = useWishlistStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "loading") return;

    if (status !== "authenticated" || !session?.user?.email) {
      setWishlist([]);
      return;
    }

    let cancelled = false;

    const fetchWishlist = async () => {
      try {
        setLoading(true);
        setError("");

        // Get the current user's ID.
        const userResponse = await apiClient.get(
          `/api/users/email/${encodeURIComponent(session.user.email!)}`,
          { cache: "no-store" }
        );

        if (!userResponse.ok) {
          throw new Error("Failed to retrieve user information.");
        }

        const userData = await userResponse.json();

        if (!userData?.id) {
          throw new Error("User account was not found.");
        }

        // Fetch wishlist records for this user.
        const response = await apiClient.get(
          `/api/wishlist/${encodeURIComponent(userData.id)}`,
          { cache: "no-store" }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.message || "Failed to fetch wishlist."
          );
        }

        // Support both an array response and { wishlist: [...] }.
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

        if (!cancelled) {
          setWishlist(productArray);
        }
      } catch (err) {
        console.error("Fetch wishlist error:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load wishlist."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchWishlist();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.email, status, setWishlist]);

  if (status === "loading" || loading) {
    return (
      <p className="py-10 text-center text-gray-500">
        Loading wishlist...
      </p>
    );
  }

  if (status !== "authenticated") {
    return (
      <p className="py-10 text-center text-gray-600">
        Please log in to view your wishlist.
      </p>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-[#02054b] px-4 py-2 text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (wishlist.length === 0) {
    return (
      <h3 className="py-10 text-center text-2xl text-black sm:text-3xl">
        No items found in the wishlist
      </h3>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl">
      <div className="overflow-x-auto">
        <table className="table text-center">
          <thead>
            <tr>
              <th></th>
              <th className="text-accent-content">Image</th>
              <th className="text-accent-content">Name</th>
              <th className="text-accent-content">Stock Status</th>
              <th className="text-accent-content">Action</th>
            </tr>
          </thead>

          <tbody>
            {wishlist.map((item) => (
              <WishItem
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                image={item.image}
                slug={item.slug}
                stockAvailabillity={item.stockAvailabillity}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};