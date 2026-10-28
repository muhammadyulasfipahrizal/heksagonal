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
    <section className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-screen-2xl">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-amber-600">
              Temukan kebutuhan Anda
            </p>

            <h2 className="text-3xl font-extrabold tracking-tight text-[#02054b] sm:text-4xl">
              Belanja berdasarkan kategori
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
              Jelajahi berbagai produk dan perlengkapan untuk mendukung
              kebutuhan bisnis serta industri Anda.
            </p>
          </div>

          {/* <Link
            href="/shop"
            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[#02054b] transition hover:text-amber-600"
          >
            Lihat semua produk
            <span aria-hidden="true">→</span>
          </Link> */}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/shop/${createSlug(category.name)}?categoryId=${encodeURIComponent(category.id)}`}
                className="group rounded-2xl border border-slate-200 bg-white p-3 transition duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-lg hover:shadow-slate-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 sm:p-4"
              >
                <div className="relative mb-4 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-5 transition-colors group-hover:bg-amber-50">
                  <Image
                    src="https://cdn.scenesku.com/resources/car-care.webp?w=1000"
                    width={96}
                    height={96}
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <h3 className="line-clamp-2 text-sm font-bold leading-5 text-slate-800 transition-colors group-hover:text-[#02054b] sm:text-base">
                     {category.name.replace(/\s*\([^)]*\)/g, "").trim()}
                  </h3>

                  <span
                    aria-hidden="true"
                    className="shrink-0 text-lg text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-amber-600"
                  >
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryMenu;