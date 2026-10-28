"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import apiClient from "@/lib/api";

interface CategoryItem {
  id: string;
  name: string;
}

interface CategoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryHeader({
  isOpen,
  onClose,
}: CategoryProps) {
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError("");

        // Ganti endpoint ini dengan route getAllCategories Anda.
        const response = await apiClient.get("/api/categories", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data: CategoryItem[] = await response.json();

        setCategories(data);
      } catch (err) {
        if (controller.signal.aborted) return;

        console.error("Failed to fetch categories:", err);
        setError("Gagal memuat kategori. Silakan coba lagi.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchCategories();

    return () => controller.abort();
  }, [isOpen]);

  if (!isOpen) return null;

  const createSlug = (name: string) =>
    name
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const handleCategoryClick = (id: string, name: string) => {
    onClose();

    const slug = createSlug(name);

    router.push(
      `/shop/${slug}?categoryId=${encodeURIComponent(id)}`
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-title"
        className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2
              id="category-title"
              className="text-xl font-bold text-gray-900 sm:text-2xl"
            >
              Kategori Produk
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Pilih kategori untuk melihat produk.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal kategori"
            className="flex h-10 w-10 items-center justify-center rounded-full text-2xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            &times;
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <p className="py-10 text-center text-gray-500">
              Memuat kategori...
            </p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-600">
              {error}
            </p>
          ) : categories.length === 0 ? (
            <p className="py-10 text-center text-gray-500">
              Belum ada kategori tersedia.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryClick(category.id, category.name)}
                  className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-4 text-left transition hover:border-blue-600 hover:bg-blue-50"
                >
                  <span className="font-medium text-gray-700">
                    {category.name.replace(/\s*\([^)]*\)/g, "").trim()}
                  </span>

                  <span className="text-lg text-gray-400">
                    &rarr;
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-gray-100 pt-5">
          <Link
            href="/shop"
            onClick={onClose}
            className="block rounded-lg bg-[#02054b] px-4 py-3 text-center font-semibold text-white transition hover:bg-[#02054b]/90"
          >
            Lihat Semua Produk
          </Link>
        </div>
      </div>
    </div>
  );
}