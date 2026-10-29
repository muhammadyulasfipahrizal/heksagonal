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

        const items = Array.isArray(result)
          ? result
          : Array.isArray(result?.wishlist)
            ? result.wishlist
            : [];

        console.log("Wishlist API items:", items);

        const productArray = items
          .filter((item: any) => item?.product?.id)
          .map((item: any) => {
            const product = item.product;

            const variants = Array.isArray(product.variants)
              ? product.variants.map((variant: any) => ({
                  id: String(variant.id),
                  title: variant.title ?? null,
                  price: Number(variant.price ?? 0),
                  image: variant.image ?? null,
                  isDefault: Boolean(variant.isDefault),
                }))
              : [];

            const defaultVariant =
              variants.find((variant: any) => variant.isDefault) ??
              variants[0];

            return {
              id: String(product.id),
              title: product.title ?? "",
              mainImage:
                defaultVariant?.image ??
                product.mainImage ??
                "",
              slug: product.slug ?? "",
              stockAvailabillity: Number(product.inStock ?? 0),
              variants,
            };
          });

        console.log("Normalized wishlist:", productArray);

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
  <section className="w-full" aria-label="My wishlist">
    {/* Mobile: product cards */}
    <div className="space-y-3 md:hidden">
      {wishlist.map((item) => {
        const variants = Array.isArray(item.variants)
          ? item.variants
          : [];

        const defaultVariant =
          variants.find((variant) => variant.isDefault) ??
          variants[0];

        return (
          <WishItem
            key={`mobile-${item.id}`}
            view="mobile"
            id={item.id}
            title={item.title}
            price={Number(defaultVariant?.price ?? 0)}
            image={defaultVariant?.image ?? item.mainImage ?? ""}
            slug={item.slug}
            stockAvailabillity={item.stockAvailabillity}
          />
        );
      })}
    </div>

    {/* Desktop: product table */}
    <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="w-14 px-4 py-4" scope="col">
                <span className="sr-only">Remove</span>
              </th>
              <th className="w-28 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500" scope="col">
                Image
              </th>
              <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500" scope="col">
                Product
              </th>
              <th className="w-36 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500" scope="col">
                Stock Status
              </th>
              <th className="w-40 px-4 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500" scope="col">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {wishlist.map((item) => {
              const variants = Array.isArray(item.variants)
                ? item.variants
                : [];

              const defaultVariant =
                variants.find((variant) => variant.isDefault) ??
                variants[0];

              return (
                <WishItem
                  key={`desktop-${item.id}`}
                  view="desktop"
                  id={item.id}
                  title={item.title}
                  price={Number(defaultVariant?.price ?? 0)}
                  image={defaultVariant?.image ?? item.mainImage ?? ""}
                  slug={item.slug}
                  stockAvailabillity={item.stockAvailabillity}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>

    <p className="mt-4 text-center text-xs text-gray-500 md:text-right">
      {wishlist.length} {wishlist.length === 1 ? "product" : "products"} in your wishlist
    </p>
  </section>
);
};