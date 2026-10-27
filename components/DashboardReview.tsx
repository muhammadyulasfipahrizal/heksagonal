"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchReviews = async () => {
      try {
        const response = await apiClient.get(
          "/api/review/admin",
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Gagal mengambil daftar review."
          );
        }

        if (!cancelled) {
          setReviews(data);
          setError("");
        }
      } catch (err) {
        console.error("Gagal mengambil review:", err);

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengambil daftar review."
          );
          setReviews([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchReviews();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredReviews = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return reviews;

    return reviews.filter((review) =>
      [
        review.id,
        review.productId,
        review.product?.title,
        review.userId,
        review.user?.name,
        review.user?.email,
        review.rating,
        review.title,
        review.comment,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [reviews, searchTerm]);

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="w-full xl:ml-5 max-xl:mt-5">
      <h1 className="mb-5 text-center text-3xl font-semibold">
        Semua Review
      </h1>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Cari produk, pengguna, email, rating, atau komentar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered w-full sm:max-w-md"
          aria-label="Cari review"
        />

        <p className="text-sm text-gray-500">
          Menampilkan {filteredReviews.length} dari {reviews.length} review
        </p>
      </div>

      <div className="overflow-x-auto">
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
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  Memuat review...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-error">
                  {error}
                </td>
              </tr>
            ) : filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <div className="font-bold">
                      {sanitize(
                        review.product?.title ?? "Produk tidak ditemukan"
                      )}
                    </div>

                    <div className="text-xs opacity-50">
                      ID: {review.productId}
                    </div>
                  </td>

                  <td>
                    <div className="font-bold">
                      {sanitize(review.user?.name ?? "Pengguna")}
                    </div>

                    <div className="text-sm opacity-60">
                      {review.user?.email
                        ? sanitize(review.user.email)
                        : review.userId}
                    </div>
                  </td>

                  <td>
                    <div
                      className="flex items-center gap-1"
                      aria-label={`Rating ${review.rating} dari 5`}
                    >
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
                      {sanitize(review.comment ?? "") ||
                        "Tidak ada komentar"}
                    </p>
                  </td>

                  <td>
                    <span className="whitespace-nowrap">
                      {formatDate(review.createdAt)}
                    </span>
                  </td>

                  <td>
                    <Link
                      href={`/admin/review/${review.id}`}
                      className="btn btn-ghost btn-xs"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  {searchTerm.trim()
                    ? `Tidak ada review yang cocok dengan "${searchTerm}".`
                    : "Belum ada review."}
                </td>
              </tr>
            )}
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