"use client";

import apiClient from "@/lib/api";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: {
    name: string | null;
  };
};

type ReviewForm = {
  rating: number;
  title: string;
  comment: string;
};

type ReviewResponse = {
  reviews: Review[];
  myReview: Review | null;
  ratingValue: number | null;
  ratingCount: number;
};

type ProductReviewProps = {
  productId: string;
};

const EMPTY_FORM: ReviewForm = {
  rating: 5,
  title: "",
  comment: "",
};

const API_URL = (productId: string, userId?: string | null) => {
  const baseUrl = `/api/review/${encodeURIComponent(productId)}`;

  return userId
    ? `${baseUrl}/${encodeURIComponent(userId)}`
    : baseUrl;
};

function getErrorMessage(
  error: unknown,
  fallback = "Terjadi kesalahan."
): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
            error?: string;
          };
        };
      }
    ).response;

    return (
      response?.data?.message ??
      response?.data?.error ??
      fallback
    );
  }

  return error instanceof Error ? error.message : fallback;
}

export default function ProductReview({
  productId,
}: ProductReviewProps) {
  const { data: session, status: sessionStatus } = useSession();
  const userId = session?.user?.id ?? null;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [ratingValue, setRatingValue] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);

  const [form, setForm] = useState<ReviewForm>(EMPTY_FORM);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

    const loadReviews = useCallback(async () => {
    if (sessionStatus === "loading") return;

    setLoading(true);
    setError("");

    try {
        const response = await apiClient.get(
        API_URL(productId, userId)
        );

        const result = await response.json();

        if (!response.ok) {
        throw new Error(
            result?.message || "Gagal memuat review."
        );
        }

        setReviews(result.reviews ?? []);
        setMyReview(result.myReview ?? null);
        setRatingValue(result.ratingValue ?? null);
        setRatingCount(result.ratingCount ?? 0);
    } catch (err: unknown) {
        setError(
        err instanceof Error
            ? err.message
            : "Gagal memuat review."
        );
    } finally {
        setLoading(false);
    }
    }, [productId, userId, sessionStatus]);

    useEffect(() => {
        void loadReviews();
    }, [loadReviews]);

    const handleEdit = () => {
        if (!myReview) return;

        setForm({
        rating: myReview.rating,
        title: myReview.title ?? "",
        comment: myReview.comment ?? "",
        });

        setEditing(true);
        setMessage("");
        setError("");
    };

    const handleCancelEdit = () => {
        setEditing(false);
        setForm(EMPTY_FORM);
        setError("");
        setMessage("");
    };

const handleSubmit = async (
  event: React.FormEvent<HTMLFormElement>
) => {
  event.preventDefault();
  setError("");
  setMessage("");

  if (!userId) {
    setError("Silakan login terlebih dahulu untuk mengirim review.");
    return;
  }

  if (form.rating < 1 || form.rating > 5) {
    setError("Rating harus antara 1 sampai 5.");
    return;
  }

  if (!form.comment.trim()) {
    setError("Komentar wajib diisi.");
    return;
  }

  setSaving(true);

  try {
    const url = API_URL(productId, userId);
    const payload = {
      rating: form.rating,
      title: form.title.trim() || null,
      comment: form.comment.trim(),
    };

    const response = editing
      ? await apiClient.put(url, payload)
      : await apiClient.post(url, payload);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.message || "Gagal menyimpan review."
      );
    }

    setForm(EMPTY_FORM);
    setEditing(false);
    setMessage(
      editing
        ? "Review berhasil diperbarui."
        : "Review berhasil ditambahkan."
    );

    await loadReviews();
  } catch (err: unknown) {
    setError(
      err instanceof Error
        ? err.message
        : "Gagal menyimpan review."
    );
  } finally {
    setSaving(false);
  }
};

const handleDelete = async () => {
  if (!userId) {
    setError("Silakan login terlebih dahulu untuk menghapus review.");
    return;
  }

  const confirmed = window.confirm(
    "Apakah kamu yakin ingin menghapus review ini?"
  );

  if (!confirmed) return;

  setDeleting(true);
  setError("");
  setMessage("");

  try {
    const response = await apiClient.delete(
      API_URL(productId, userId)
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.message || "Gagal menghapus review."
      );
    }

    setForm(EMPTY_FORM);
    setEditing(false);
    setMessage("Review berhasil dihapus.");

    await loadReviews();
  } catch (err: unknown) {
    setError(
      err instanceof Error
        ? err.message
        : "Gagal menghapus review."
    );
  } finally {
    setDeleting(false);
  }
};

  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <section className="mt-10 border-t border-gray-200 pt-8">
        <div className="mb-6">
          <div className="mb-8 rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="mb-4 font-semibold text-gray-900">
            {editing
              ? "Edit Review Kamu"
              : myReview
                ? "Review Kamu"
                : "Tulis Review"}
          </h3>

          {myReview && !editing ? (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-yellow-500">
                  {"★".repeat(myReview.rating)}
                  <span className="text-gray-300">
                    {"★".repeat(5 - myReview.rating)}
                  </span>
                </span>

                <span className="text-sm text-gray-500">
                  {myReview.rating}/5
                </span>
              </div>

              {myReview.title && (
                <h4 className="font-medium text-gray-900">
                  {myReview.title}
                </h4>
              )}

              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                {myReview.comment}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Edit Review
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? "Menghapus..." : "Hapus Review"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Rating
                </label>

                <div
                  className="flex gap-1"
                  role="group"
                  aria-label="Pilih rating"
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          rating: star,
                        }))
                      }
                      aria-label={`${star} bintang`}
                      aria-pressed={form.rating === star}
                      className={`text-3xl transition ${
                        star <= form.rating
                          ? "text-yellow-500"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="review-title"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Judul (opsional)
                </label>

                <input
                  id="review-title"
                  type="text"
                  maxLength={200}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Contoh: Produk berkualitas"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                />
              </div>

              <div>
                <label
                  htmlFor="review-comment"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Komentar
                </label>

                <textarea
                  id="review-comment"
                  required
                  rows={4}
                  maxLength={5000}
                  value={form.comment}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      comment: event.target.value,
                    }))
                  }
                  placeholder="Ceritakan pengalaman kamu menggunakan produk ini..."
                  className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500"
                />

                <p className="mt-1 text-right text-xs text-gray-400">
                  {form.comment.length}/5000
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving || sessionStatus === "loading"}
                  className="rounded-md bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : editing
                      ? "Simpan Perubahan"
                      : "Kirim Review"}
                </button>

                {editing && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
        {ratingValue !== null && ratingValue >= 4 && (
            <>
                <div className="flex flex-row justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                    Ulasan Produk
                </h2>

                <h3 className="mb-4 font-semibold text-gray-900">
                    Semua Review ({ratingCount})
                </h3>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xl font-semibold text-gray-900">
                    {ratingValue.toFixed(1)}
                </span>

                <span className="text-yellow-500" aria-label="Rating bintang">
                    {"★".repeat(Math.max(0, Math.min(5, Math.round(ratingValue))))}

                    <span className="text-gray-300">
                    {"★".repeat(
                        5 - Math.max(0, Math.min(5, Math.round(ratingValue)))
                    )}
                    </span>
                </span>

                <span className="text-sm text-gray-500">
                    {ratingCount} ulasan
                </span>
                </div>
            </>
            )}

        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
            <div
                role="status"
                aria-live="polite"
                className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-lg border border-green-200 bg-white px-4 py-3 text-sm text-green-700 shadow-lg"
            >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                ✓
                </span>

                <p>{message}</p>

                <button
                type="button"
                onClick={() => setMessage("")}
                aria-label="Tutup notifikasi"
                className="ml-2 text-gray-400 hover:text-gray-700"
                >
                ✕
                </button>
            </div>
        )}

        

        <div>
          
          {loading ? (
            <p className="text-sm text-gray-500">Memuat review...</p>
          ) : reviews.length === 0 ? (
            <p className="rounded-lg bg-gray-50 p-5 text-sm text-gray-500">
              Belum ada review untuk produk ini. Jadilah yang pertama
              memberikan ulasan!
            </p>
          ) : (
            <div className="divide-y divide-gray-200">
              {reviews
                .filter((review) => review.rating >= 4)
                .map((review) => (
                <article key={review.id} className="py-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-gray-900">
                      {review.user?.name || "Pengguna"}
                    </p>

                    <time
                      dateTime={review.createdAt}
                      className="text-xs text-gray-500"
                    >
                      {new Date(review.createdAt).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </time>
                  </div>

                  <div
                    className="mt-1 text-sm text-yellow-500"
                    aria-label={`Rating ${review.rating} dari 5`}
                  >
                    {"★".repeat(
                      Math.max(0, Math.min(5, review.rating))
                    )}
                    <span className="text-gray-300">
                      {"★".repeat(
                        5 - Math.max(0, Math.min(5, review.rating))
                      )}
                    </span>
                  </div>

                  {review.title && (
                    <h4 className="mt-2 font-medium text-gray-800">
                      {review.title}
                    </h4>
                  )}

                  {review.comment && (
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                      {review.comment}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}