// *********************
// Role of the component: Category wrapper that will contain title and category items
// Name of the component: CategoryMenu.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <CategoryMenu />
// Input parameters: no input parameters
// Output: section title and category items
// *********************

"use client";

import React, { useEffect, useState } from "react";
import CategoryItem from "./CategoryItem";
import Image from "next/image";
import apiClient from "@/lib/api";

interface Category {
  id: string;
  name: string;
}

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

        // Sesuaikan dengan endpoint getAllCategories di Express Anda.
        const response = await apiClient.get("/api/categories", {
          cache: "no-store",
          signal: controller.signal,
        });

        const data: Category[] = await response.json();

        setCategories(data);
      } catch (err) {
        if (controller.signal.aborted) return;

        console.error("Failed to fetch categories:", err);
        setError("Gagal memuat kategori.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchCategories();

    return () => controller.abort();
  }, []);

  const createSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  return (
    <div className="bg-white py-14">
      <h2 className="text-center text-7xl font-extrabold text-[#02054b] max-lg:text-5xl">
        KATEGORI
      </h2>

      <div className="mx-auto grid max-w-screen-2xl grid-cols-3 gap-x-5 gap-y-5 px-16 py-10 max-md:grid-cols-2 max-md:px-10 max-[425px]:grid-cols-1">
        {isLoading ? (
          <p className="col-span-full py-10 text-center text-gray-500">
            Memuat kategori...
          </p>
        ) : error ? (
          <p className="col-span-full py-10 text-center text-red-600">
            {error}
          </p>
        ) : categories.length === 0 ? (
          <p className="col-span-full py-10 text-center text-gray-500">
            Belum ada kategori tersedia.
          </p>
        ) : (
          categories.map((category) => (
            <CategoryItem
              title={category.name}
              key={category.id}
              href={`/shop?categoryId=${category.id}`}
            >
              <Image
                src="/category-placeholder.png"
                width={48}
                height={48}
                alt={category.name}
              />
            </CategoryItem>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryMenu;
