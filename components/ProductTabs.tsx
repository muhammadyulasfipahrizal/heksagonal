// *********************
// Role of the component: Single product tabs on the single product page containing product description, main product info and reviews
// Name of the component: ProductTabs.tsx
// Developer: Aleksandar Kuzmanovic
// Version: 1.0
// Component call: <ProductTabs product={product} />
// Input parameters: { product: Product }
// Output: Single product tabs containing product description, main product info and reviews
// *********************

"use client";

import React from "react";
import { formatCategoryName } from "@/utils/categoryFormating";
import { sanitize, sanitizeHtml } from "@/lib/sanitize";

const ProductTabs = ({ product }: { product: Product }) => {
  return (
    <div className="px-5 text-black">
      <div role="tablist" className="tabs tabs-bordered">
        <a
          role="tab"
          aria-selected="true"
          className="tab tab-active text-lg text-black pb-8 max-[500px]:text-base max-[400px]:text-sm max-[370px]:text-xs"
        >
          
        </a>
      </div>

      <div className="pt-5 space-y-8">
        {/* Additional info */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 max-sm:text-xl">
            Informasi
          </h2>

          <div className="overflow-x-auto">
            <table className="table text-lg max-[500px]:text-base">
              <tbody>
                <tr>
                  <th className="w-1/3">Merek</th>
                  <td>{sanitize(product?.manufacturer)}</td>
                </tr>
                <tr>
                  <th>Kategori</th>
                  <td>
                    {product?.category?.name
                      ? sanitize(
                          formatCategoryName(product.category.name)
                        )
                      : "No category"}
                  </td>
                </tr>
                <tr>
                  <th>Kode Produk</th>
                  <td>{sanitize(product?.code ?? "") || "-"}</td>
                </tr>
                <tr>
                  <th>Berat</th>
                  <td>
                    {product?.weight != null
                      ? `${product.weight} kg`
                      : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Description */}
        <section>
          <h2 className="text-2xl font-semibold mb-4 max-sm:text-xl">
            Deskripsi
          </h2>

          <div
            className="text-lg max-sm:text-base"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(product?.description ?? ""),
            }}
          />
        </section>
      </div>
    </div>
  );
};

export default ProductTabs;