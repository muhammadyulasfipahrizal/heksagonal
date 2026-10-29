
export const dynamic = "force-dynamic";
export const revalidate = 0;

import {
  Breadcrumb,
  Filters,
  Pagination,
  Products,
  SortBy,
} from "@/components";
import { sanitize } from "@/lib/sanitize";
import apiClient from "@/lib/api";
import FilterToggle from "@/components/ShopMobileControls";

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

      categoryName = category?.name.replace(/\s*\([^)]*\)/g, "").trim() ?? "";
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
    <div className="mx-3 min-h-screen bg-white text-black lg:mx-8 lg:my-10">
      <div className="mx-auto w-full max-w-screen-2xl">
        {/* Heading khusus mobile: berada di atas filter */}
        <h2 className="mb-4 min-w-0 break-words text-xl font-bold uppercase lg:hidden">
          {sanitize(heading)}
        </h2>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          {/* Sidebar Filter */}
          <aside className="min-w-0">
            <FilterToggle>
              <Filters />
            </FilterToggle>
          </aside>

          {/* Konten utama */}
          <section className="min-w-0">
            <div className="flex min-w-0 flex-col gap-4 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
              {/* Heading khusus desktop */}
              <h2 className="hidden min-w-0 break-words text-xl font-bold uppercase sm:text-2xl lg:block">
                {sanitize(heading)}
              </h2>

              <div className="w-full lg:w-auto lg:shrink-0">
                <SortBy />
              </div>
            </div>

            <div className="divider my-3 sm:my-4" />

            <Products
              params={awaitedParams}
              searchParams={awaitedSearchParams}
            />

            <Pagination currentPage={currentPage} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
