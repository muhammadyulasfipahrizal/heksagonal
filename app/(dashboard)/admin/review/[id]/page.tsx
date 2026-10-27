"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { sanitize } from "@/lib/sanitize";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

type Review = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt?: string;
  product?: {
    id: string;
    title: string;
    slug?: string;
  };
  user?: {
    id: string;
    name: string | null;
    email?: string;
  };
};

const AdminSingleReview = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchReview = async () => {
      setIsLoading(true);

      try {
        const response = await apiClient.get(
          `/api/review/admin/${params.id}`
        );

        const data = await response.json();

        if (!cancelled) {
          setReview(data);
        }

        if (!response.ok) {
          throw new Error(
            data?.message || "Gagal mengambil daftar review."
          );
        }


      } catch (error) {
        console.error("Failed to fetch review:", error);

        if (!cancelled) {
          toast.error("Failed to load review details");
          setReview(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    if (params.id) {
      void fetchReview();
    }

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const updateField = <K extends keyof Review>(
    field: K,
    value: Review[K]
  ) => {
    setReview((current) =>
      current ? { ...current, [field]: value } : current
    );
  };

  const updateReview = async () => {
    if (!review || isSaving || isDeleting) return;

    if (
      !Number.isInteger(review.rating) ||
      review.rating < 1 ||
      review.rating > 5
    ) {
      toast.error("Rating must be between 1 and 5");
      return;
    }

    if (!review.comment?.trim()) {
      toast.error("Review comment is required");
      return;
    }

    if (review.comment.trim().length > 5000) {
      toast.error("Review comment must not exceed 5000 characters");
      return;
    }

    if ((review.title?.trim().length ?? 0) > 200) {
      toast.error("Review title must not exceed 200 characters");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        rating: review.rating,
        title: review.title?.trim() || null,
        comment: review.comment.trim(),
      };

      await apiClient.put(
        `/api/review/admin/${review.id}`,
        payload
      );

      setReview((current) =>
        current
          ? {
              ...current,
              ...payload,
            }
          : current
      );

      toast.success("Review updated successfully");
    } catch (error) {
      console.error("Failed to update review:", error);

      toast.error("Failed to update review");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteReview = async () => {
    if (!review || isSaving || isDeleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this review?"
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      await apiClient.delete(`/api/review/admin/${review.id}`);

      toast.success("Review deleted successfully");
      router.push("/admin/reviews");
    } catch (error) {
      console.error("Failed to delete review:", error);
      toast.error("Failed to delete review");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-white">
        <DashboardSidebar />
        <main className="w-full p-6">
          <p>Loading review details...</p>
        </main>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex min-h-screen bg-white">
        <DashboardSidebar />
        <main className="w-full p-6">
          <h1 className="text-2xl font-semibold">Review not found</h1>

          <Link
            href="/admin/reviews"
            className="mt-4 inline-block text-blue-700 underline"
          >
            Back to reviews
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start bg-white xl:h-full max-xl:flex-col max-xl:gap-y-5">
      <DashboardSidebar />

      <main className="flex w-full flex-col gap-y-7 xl:ml-5 max-xl:px-5">
        <h1 className="text-3xl font-semibold">Review details</h1>

        <section>
          <p className="text-xl font-bold">Review ID:</p>
          <p className="break-all text-base">{review.id}</p>
        </section>

        <section>
          <p className="mb-1 text-sm text-gray-500">Product</p>

          {review.product?.slug ? (
            <Link
              href={`/product/${review.product.slug}`}
              className="font-semibold hover:underline"
            >
              {sanitize(review.product.title)}
            </Link>
          ) : (
            <p className="font-semibold">
              {sanitize(review.product?.title ?? "Product not found")}
            </p>
          )}

          <p className="mt-1 break-all text-xs text-gray-500">
            Product ID: {review.productId}
          </p>
        </section>

        <section>
          <p className="mb-1 text-sm text-gray-500">Reviewer</p>
          <p className="font-semibold">
            {sanitize(review.user?.name ?? "Unknown user")}
          </p>

          <p className="text-sm text-gray-600">
            {review.user?.email
              ? sanitize(review.user.email)
              : review.userId}
          </p>

          <p className="mt-1 break-all text-xs text-gray-500">
            User ID: {review.userId}
          </p>
        </section>

        <section>
          <p className="mb-2 text-sm text-gray-500">Created at</p>
          <p>{formatDate(review.createdAt)}</p>

          {review.updatedAt && (
            <>
              <p className="mb-2 mt-4 text-sm text-gray-500">Last updated</p>
              <p>{formatDate(review.updatedAt)}</p>
            </>
          )}
        </section>

        <section>
          <label className="form-control w-full max-w-md">
            <span className="label-text mb-2">Rating</span>

            <select
              className="select select-bordered"
              value={review.rating}
              onChange={(e) =>
                updateField("rating", Number(e.target.value))
              }
            >
              <option value={1}>1 - Very poor</option>
              <option value={2}>2 - Poor</option>
              <option value={3}>3 - Average</option>
              <option value={4}>4 - Good</option>
              <option value={5}>5 - Excellent</option>
            </select>

            <div className="mt-2 text-xl text-yellow-500">
              {"★".repeat(review.rating)}
              <span className="text-gray-300">
                {"★".repeat(5 - review.rating)}
              </span>
            </div>
          </label>
        </section>

        <section>
          <label className="form-control w-full max-w-xl">
            <span className="label-text mb-2">Review title (optional)</span>

            <input
              type="text"
              maxLength={200}
              className="input input-bordered"
              placeholder="Enter review title"
              value={review.title ?? ""}
              onChange={(e) => updateField("title", e.target.value)}
            />

            <span className="mt-1 text-xs text-gray-500">
              {(review.title ?? "").length}/200 characters
            </span>
          </label>
        </section>

        <section>
          <label className="form-control w-full max-w-xl">
            <span className="label-text mb-2">Review comment</span>

            <textarea
              className="textarea textarea-bordered min-h-40"
              maxLength={5000}
              placeholder="Enter review comment"
              value={review.comment ?? ""}
              onChange={(e) => updateField("comment", e.target.value)}
            />

            <span className="mt-1 text-xs text-gray-500">
              {(review.comment ?? "").length}/5000 characters
            </span>
          </label>
        </section>

        <section className="flex flex-col gap-y-2">
          <h2 className="text-xl font-semibold">Review preview</h2>

          <div className="max-w-xl rounded-lg border p-5">
            <div className="mb-2 text-yellow-500">
              {"★".repeat(review.rating)}
              <span className="text-gray-300">
                {"★".repeat(5 - review.rating)}
              </span>
            </div>

            {review.title?.trim() && (
              <h3 className="mb-2 font-semibold">
                {sanitize(review.title)}
              </h3>
            )}

            <p className="whitespace-pre-wrap break-words text-sm text-gray-700">
              {sanitize(review.comment ?? "") || "No comment"}
            </p>

            <p className="mt-4 text-xs text-gray-500">
              By {sanitize(review.user?.name ?? "Unknown user")}
            </p>
          </div>
        </section>

        <div className="mt-5 flex gap-x-2 max-sm:flex-col max-sm:gap-y-3">
          <button
            type="button"
            disabled={isSaving || isDeleting}
            className="border-gray-300 border bg-[#02054b] px-10 py-5 text-lg font-bold uppercase text-white shadow-sm hover:bg-[#01043D] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={updateReview}
          >
            {isSaving ? "Saving..." : "Update review"}
          </button>

          <button
            type="button"
            disabled={isSaving || isDeleting}
            className="border-gray-300 border bg-red-600 px-10 py-5 text-lg font-bold uppercase text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={deleteReview}
          >
            {isDeleting ? "Deleting..." : "Delete review"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminSingleReview;