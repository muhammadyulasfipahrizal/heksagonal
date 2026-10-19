
import React from "react";
import ProductItem from "./ProductItem";
import apiClient from "@/lib/api";

const Products = async ({
  searchParams,
}: {
  params?: { slug?: string[] };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}) => {
  const inStockNum = searchParams?.inStock === "true" ? 1 : 0;
  const outOfStockNum = searchParams?.outOfStock === "true" ? 1 : 0;

  const rawPage = searchParams?.page;
  const parsedPage =
    typeof rawPage === "string" ? Number(rawPage) : 1;

  const page =
    Number.isInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;

  // Default harga maksimal: Rp100.000.000
  const rawPrice = searchParams?.price;
  const parsedPrice =
    typeof rawPrice === "string" && rawPrice.trim() !== ""
      ? Number(rawPrice)
      : NaN;

  const maxPrice =
    Number.isFinite(parsedPrice) && parsedPrice >= 0
      ? parsedPrice
      : 100_000_000;

  const rawRating = searchParams?.rating;
  const parsedRating =
    typeof rawRating === "string" ? Number(rawRating) : 0;

  const rating = Number.isFinite(parsedRating) ? parsedRating : 0;

  let stockMode: string = "lte";

  if (inStockNum === 1) {
    stockMode = "equals";
  }

  if (outOfStockNum === 1) {
    stockMode = "lt";
  }

  if (inStockNum === 1 && outOfStockNum === 1) {
    stockMode = "lte";
  }

  if (inStockNum === 0 && outOfStockNum === 0) {
    stockMode = "gt";
  }

  let products = [];

  try {
    const query = new URLSearchParams();

    // 1. Category filter
    const rawCategoryId = searchParams?.categoryId;
    const categoryId =
      typeof rawCategoryId === "string" ? rawCategoryId : "";

    if (categoryId) {
      query.set("categoryId", categoryId);
    }

    // 2. Apply price filter only if explicitly present in URL
    const rawPrice = searchParams?.price;

    if (typeof rawPrice === "string" && rawPrice.trim() !== "") {
      const price = Number(rawPrice);

      if (Number.isFinite(price) && price >= 0) {
        query.set("filters[price][$lte]", String(price));
      }
    }

    // 3. Apply rating filter only if explicitly present in URL
    const rawRating = searchParams?.rating;

    if (typeof rawRating === "string" && rawRating.trim() !== "") {
      const rating = Number(rawRating);

      if (Number.isFinite(rating) && rating >= 0 && rating <= 5) {
        query.set("filters[rating][$gte]", String(rating));
      }
    }

    // 4. Apply stock filter only if explicitly present in URL
    const rawInStock = searchParams?.inStock;
    const rawOutOfStock = searchParams?.outOfStock;

    if (
      typeof rawInStock === "string" &&
      typeof rawOutOfStock === "string"
    ) {
      const inStock = rawInStock === "true";
      const outOfStock = rawOutOfStock === "true";

      if (inStock && !outOfStock) {
        query.set("filters[inStock][$gt]", "0");
      } else if (!inStock && outOfStock) {
        query.set("filters[inStock][$equals]", "0");
      }
      // Both selected: show all stock statuses, so no stock filter.
    }

    // 5. Sorting and pagination
    query.set(
      "sort",
      typeof searchParams?.sort === "string"
        ? searchParams.sort
        : "defaultSort"
    );

    query.set("page", String(page));

    const data = await apiClient.get(
      `/api/products?${query.toString()}`
    );

    

    if (!data.ok) {
      console.error("Failed to fetch products:", data.statusText);
    } else {
      const result = await data.json();

      console.log("isi data", result);

      // Mendukung response baru berbentuk object
      // dan response lama yang berbentuk array.
      products = Array.isArray(result)
        ? result
        : Array.isArray(result?.products)
          ? result.products
          : [];
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    products = [];
  }

  return (
    <div className="grid grid-cols-3 justify-items-center gap-x-2 gap-y-5 max-[1300px]:grid-cols-3 max-lg:grid-cols-2 max-[500px]:grid-cols-1">
      {products.length > 0 ? (
        products.map((product) => (
          <ProductItem
            key={product.id}
            product={product}
            color="black"
          />
        ))
      ) : (
        <h3 className="col-span-full mt-5 w-full text-center text-xl">
          No products found
        </h3>
      )}
    </div>
  );
};

export default Products;