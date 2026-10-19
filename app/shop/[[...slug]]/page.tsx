
export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  Breadcrumb,
  Filters,
  Pagination,
  Products,
  SortBy,
} from "@/components";
import React from "react";
import { sanitize } from "@/lib/sanitize";
import apiClient from "@/lib/api";

type Category = {
  id: string;
  name: string;
  slug?: string;
};

type ShopPageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<{
    [key: string]: string | string[] | undefined;
  }>;
};

const improveCategoryText = (text: string): string =>
  text.split("-").join(" ");

const ShopPage = async ({
  params,
  searchParams,
}: ShopPageProps) => {
  const awaitedParams = await params;
  const awaitedSearchParams = await searchParams;

  const rawCategoryId = awaitedSearchParams.categoryId;
  const categoryId =
    typeof rawCategoryId === "string" ? rawCategoryId : "";

  const rawSlug = awaitedParams.slug?.[0] ?? "";

  let categoryName = "";

  try {
    const response = await apiClient.get("/api/categories");

    if (response.ok) {
      const result = await response.json();

      const categories: Category[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.categories)
          ? result.categories
          : [];

      const category = categories.find((item) => {
        if (categoryId && item.id === categoryId) {
          return true;
        }

        if (
          rawSlug &&
          item.slug &&
          item.slug.toLowerCase() === rawSlug.toLowerCase()
        ) {
          return true;
        }

        return false;
      });

      categoryName = category?.name ?? "";
    } else {
      console.error(
        "Failed to fetch categories:",
        response.statusText
      );
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
  }

  const heading = categoryName
    ? categoryName
    : rawSlug
      ? improveCategoryText(rawSlug)
      : "All products";

  const currentPage = Math.max(
    1,
    Number(awaitedSearchParams.page) || 1
  );

  return (
    <div className="text-black bg-white">
      <div className="max-w-screen-2xl mx-auto px-10 max-sm:px-5">
        <Breadcrumb />

        <div className="grid grid-cols-[200px_1fr] gap-x-10 max-md:grid-cols-1 max-md:gap-y-5">
          <Filters />

          <div>
            <div className="flex justify-between items-center max-lg:flex-col max-lg:gap-y-5">
              <h2 className="text-2xl font-bold max-sm:text-xl max-[400px]:text-lg uppercase">
                {sanitize(heading)}
              </h2>

              <SortBy />
            </div>

            <div className="divider"></div>

            <Products
              params={awaitedParams}
              searchParams={awaitedSearchParams}
            />

            <Pagination currentPage={currentPage} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
