// *********************
// Role of the component: products section intended to be on the home page
// Name of the component: ProductsSection.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <ProductsSection slug={slug} />
// Input parameters: no input parameters
// Output: products grid
// *********************

import React from "react";
import ProductItem from "./ProductItem";
import Heading from "./Heading";
import apiClient from "@/lib/api";

const ProductsSection = async () => {
  let products = [];
  
  try {
    // sending API request for getting all products
    const data = await apiClient.get("/api/products");
    
    if (!data.ok) {
      console.error('Failed to fetch products:', data.statusText);
      products = [];
    } else {
      const result = await data.json();
      // Ensure products is an array
      products = Array.isArray(result) ? result : [];
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    products = [];
  }

  return (
    <div className="bg-[#02054b] border-t-4 border-white">
      <div className="max-w-screen-2xl mx-auto">
        <Heading title="PRODUK UNGGULAN" />
        <div className="grid w-full grid-cols-1 gap-x-6 gap-y-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
          {products.length > 0 ? (
            products.map((product: any) => (
              <ProductItem key={product.id} product={product} color="white" />
            ))
          ) : (
            <div className="col-span-full text-center text-white py-10">
              <p>No products available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsSection;
