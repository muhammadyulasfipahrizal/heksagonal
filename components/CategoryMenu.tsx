"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import apiClient from "@/lib/api";

interface Category {
  id: string;
  name: string;
}

const createSlug = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const CategoryMenu = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await apiClient.get("/api/categories", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil kategori.");
        }

        const result = await response.json();

        // Mendukung response array atau object dengan properti categories.
        const data: Category[] = Array.isArray(result)
          ? result
          : Array.isArray(result?.categories)
            ? result.categories
            : [];

        setCategories(data);
      } catch (err) {
        if (controller.signal.aborted) return;

        console.error("Failed to fetch categories:", err);
        setError("Kategori belum dapat dimuat. Silakan coba lagi.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchCategories();

    return () => controller.abort();
  }, []);

  return (
    <section className="bg-white px-3 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-container">
        <div className="mb-6 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 sm:text-xs sm:tracking-[0.22em]">
              Temukan kebutuhan Anda
            </p>

            <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-[#02054b] sm:text-3xl lg:text-4xl">
              Belanja berdasarkan kategori
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:mt-3 sm:text-base">
              Jelajahi berbagai produk dan perlengkapan untuk mendukung kebutuhan
              bisnis serta industri Anda.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-slate-200 p-5"
              >
                <div className="mb-4 aspect-[4/3] rounded-xl bg-slate-100" />
                <div className="mx-auto h-4 w-3/4 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center text-sm text-red-600"
          >
            {error}
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center">
            <p className="font-semibold text-slate-700">
              Belum ada kategori tersedia.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Silakan periksa kembali nanti.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:gap-5">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category.id}
                  href={`/shop/${createSlug(category.name)}?categoryId=${encodeURIComponent(category.id)}`}
                  className="
                    group min-w-0 rounded-xl border border-slate-200
                    bg-white p-2.5
                    transition duration-300
                    hover:-translate-y-1 hover:border-amber-300
                    hover:shadow-lg hover:shadow-slate-200/60
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-amber-500
                    sm:rounded-2xl sm:p-4
                  "
                >
                  <div
                    className="
                      relative mb-3 flex aspect-[4/3]
                      items-center justify-center overflow-hidden
                      rounded-lg bg-slate-50 p-3
                      transition-colors group-hover:bg-amber-50
                      sm:mb-4 sm:rounded-xl sm:p-5
                    "
                  >
                    <Image
                      src="https://cdn.scenesku.com/resources/car-care.webp?w=1000"
                      width={96}
                      height={96}
                      alt=""
                      aria-hidden="true"
                      className="
                        h-full w-full object-contain
                        transition-transform duration-300
                        group-hover:scale-110
                      "
                    />
                  </div>

                  <div className="flex min-w-0 items-start justify-between gap-1.5 sm:items-center sm:gap-2">
                    <h3
                      className="
                        min-w-0 flex-1 break-words
                        text-xs font-bold leading-4 text-slate-800
                        transition-colors group-hover:text-[#02054b]
                        sm:text-sm sm:leading-5 lg:text-base
                      "
                    >
                      {category.name.replace(/\s*\([^)]*\)/g, "").trim()}
                    </h3>

                    <span
                      aria-hidden="true"
                      className="
                        hidden shrink-0 text-lg text-slate-400
                        transition-all group-hover:translate-x-1
                        group-hover:text-amber-600 sm:inline
                      "
                    >
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Tombol lihat semua kategori */}
            {categories.length > 6 && (
              <div className="mt-7 flex justify-center sm:mt-9">
                <Link
                  href="/shop"
                  className="
                    btn min-h-12 w-full max-w-sm
                    gap-2 rounded-xl border-0
                    bg-[#02054b] px-5 text-sm font-bold
                    normal-case text-white shadow-lg
                    transition duration-300
                    hover:-translate-y-0.5 hover:bg-amber-300
                    hover:text-[#02054b] hover:shadow-xl
                    focus-visible:outline-none focus-visible:ring-2
                    focus-visible:ring-amber-500
                    focus-visible:ring-offset-2
                    sm:w-auto sm:px-7 sm:text-base
                  "
                >
                  Lihat semua kategori
                  <span aria-hidden="true" className="text-lg sm:text-xl">
                    →
                  </span>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default CategoryMenu;