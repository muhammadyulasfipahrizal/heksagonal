"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useWishlistStore } from "@/app/_zustand/wishlistStore";
import apiClient from "@/lib/api";
import toast from "react-hot-toast";

type AddToWishlistBtnProps = {
  product: ProductInWishlist;
};

const AddToWishlistBtn = ({ product }: AddToWishlistBtnProps) => {
  const { data: session, status } = useSession();
  const { wishlist, addToWishlist } = useWishlistStore();
  const [loading, setLoading] = useState(false);

  const isWishlisted = wishlist.some((item) => item.id === product.id);

  const handleAddToWishlist = async () => {
    if (status === "loading" || loading) return;

    if (!session?.user?.email) {
      toast.error("Please log in to add products to your wishlist.");
      return;
    }

    if (isWishlisted) {
      toast.success("This product is already in your wishlist.");
      return;
    }

    try {
      setLoading(true);

      // Find the current user's ID using their email.
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

      // Create the wishlist record in the backend.
      const response = await apiClient.post("/api/wishlist", {
        userId: userData.id,
        productId: product.id,
      });

      const responseText = await response.text();

      let result: any;

      try {
        result = responseText ? JSON.parse(responseText) : {};
      } catch {
        result = { message: responseText };
      }

      console.log("Wishlist API Debug:", {
        status: response.status,
        ok: response.ok,
        userId: userData.id,
        productId: product.id,
        response: result,
      });

      if (!response.ok) {
        if (response.status === 409) {
          addToWishlist(product);
          toast.success("This product is already in your wishlist.");
          return;
        }

        throw new Error(
          result?.message ||
            result?.error ||
            result?.details ||
            `Wishlist API failed with status ${response.status}`
        );
      }

      addToWishlist(product);
      toast.success(result?.message || "Added to wishlist successfully.");
    } catch (error) {
      console.error("Add to wishlist error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Something went wrong while adding to wishlist."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAddToWishlist}
      disabled={loading || status === "loading"}
      aria-label={
        isWishlisted ? "Already in wishlist" : "Add to wishlist"
      }
      aria-pressed={isWishlisted}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        isWishlisted
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-gray-300 bg-white text-gray-700 hover:border-red-500 hover:text-red-500"
      }`}
    >
      <span aria-hidden="true">
        {isWishlisted ? "♥" : "♡"}
      </span>
      {loading
        ? "Adding..."
        : isWishlisted
          ? "Added to Wishlist"
          : "Add to Wishlist"}
    </button>
  );
};

export default AddToWishlistBtn;