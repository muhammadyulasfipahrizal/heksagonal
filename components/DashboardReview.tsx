"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import apiClient from "@/lib/api";
import { sanitize } from "@/lib/sanitize";

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

const DashboardReviewTable = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchReviews = async () => {
      try {
        const response = await apiClient.get(
          "/api/review?mode=admin",
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Gagal mengambil daftar review."
          );
        }

        if (!Array.isArray(data)) {
          throw new Error("Format data review tidak valid.");
        }

        if (!cancelled) {
          setReviews(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat mengambil review."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "—";
    }

    return parsedDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="w-full">
      <h1 className="mb-5 text-center text-3xl font-semibold">
        Semua Review
      </h1>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm opacity-70">
          Total review: {reviews.length}
        </p>
      </div>

      <div className="xl:ml-5 max-xl:mt-5 h-[80vh] w-full overflow-auto">
        <table className="table table-md table-pin-cols">
          <thead>
            <tr>
              <th>Produk</th>
              <th>Pengguna</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Tanggal</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  Memuat review...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-error">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && reviews.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  Belum ada review.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <div className="font-bold">
                      {sanitize(review.product?.title ?? "Produk tidak ditemukan")}
                    </div>

                    <div className="text-xs opacity-50">
                      ID: {review.productId}
                    </div>
                  </td>

                  <td>
                    <div className="font-medium">
                      {sanitize(review.user?.name ?? "Pengguna")}
                    </div>

                    <div className="text-xs opacity-60">
                      {review.user?.email
                        ? sanitize(review.user.email)
                        : review.userId}
                    </div>
                  </td>

                  <td>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">
                        {"★".repeat(
                          Math.max(0, Math.min(5, review.rating))
                        )}
                      </span>

                      <span className="text-gray-300">
                        {"★".repeat(
                          5 - Math.max(0, Math.min(5, review.rating))
                        )}
                      </span>
                    </div>

                    <div className="text-xs opacity-60">
                      {review.rating}/5
                    </div>
                  </td>

                  <td className="max-w-xs">
                    {review.title && (
                      <div className="font-semibold">
                        {sanitize(review.title)}
                      </div>
                    )}

                    <p className="line-clamp-3 text-sm opacity-70">
                      {sanitize(review.comment ?? "") || "Tidak ada komentar"}
                    </p>
                  </td>

                  <td>
                    <span className="whitespace-nowrap">
                      {formatDate(review.createdAt)}
                    </span>
                  </td>

                  <th>
                    <Link
                      href={`/admin/reviews/${review.id}`}
                      className="btn btn-ghost btn-xs"
                    >
                      Details
                    </Link>
                  </th>
                </tr>
              ))}
          </tbody>

          <tfoot>
            <tr>
              <th>Produk</th>
              <th>Pengguna</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Tanggal</th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DashboardReviewTable;