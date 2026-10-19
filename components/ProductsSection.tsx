
import React from "react";
import ProductItem from "./ProductItem";
import Heading from "./Heading";
import apiClient from "@/lib/api";

const ProductsSection = async () => {
  let products: any[] = [];

  try {
    // Mengambil produk dari API.
    const data = await apiClient.get("/api/products");

    if (!data.ok) {
      console.error("Failed to fetch products:", data.statusText);
    } else {
      const result = await data.json();

      // Mendukung format response lama (array)
      // dan format terbaru ({ products: [...] }).
      const fetchedProducts = Array.isArray(result)
        ? result
        : Array.isArray(result?.products)
          ? result.products
          : [];

      // Tampilkan maksimal 9 produk.
      products = fetchedProducts.slice(0, 9);
    }
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <div className="bg-[#02054b] border-t-4 border-white">
      <div className="max-w-screen-2xl mx-auto">
        <Heading title="PRODUK UNGGULAN" />

        <div className="grid w-full grid-cols-1 gap-x-6 gap-y-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {products.length > 0 ? (
            products.map((product) => (
              <ProductItem
                key={product.id}
                product={product}
                color="white"
              />
            ))
          ) : (
            <div className="col-span-full py-10 text-center text-white">
              <p>No products available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsSection;
