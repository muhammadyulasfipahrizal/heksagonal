"use client";

import React from "react";
import { formatCategoryName } from "@/utils/categoryFormating";
import { sanitize, sanitizeHtml } from "@/lib/sanitize";

const ProductTabs = ({ product }: { product: Product }) => {
  const information = [
    {
      label: "Kategori",
      value: product?.category?.name
        ? sanitize(formatCategoryName(product.category.name))
        : "-",
    },
    {
      label: "Kode produk",
      value: sanitize(product?.code ?? "") || "-",
    },
    {
      label: "Berat",
      value:
        product?.weight != null
          ? `${product.weight} kg`
          : "-",
    },
  ];

  return (
    <section className="w-full">
      {/* <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          Detail produk
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
          Deskripsi produk
        </h2>
      </div> */}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Description */}
        <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 sm:p-7 lg:col-span-2">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5 text-gray-700"
                aria-hidden="true"
              >
                <path
                  d="M7 3.75h7l5 5v11.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 3.75v5h5M9 13h6M9 16.5h6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-950">
                Deskripsi produk
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Informasi lengkap mengenai produk.
              </p>
            </div>
          </div>

          {product?.description?.trim() ? (
            <div
              className="product-description break-words text-sm leading-7 text-gray-600 sm:text-base"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(product.description),
              }}
            />
          ) : (
            <div className="rounded-xl bg-gray-50 px-5 py-8 text-center">
              <p className="text-sm text-gray-500">
                Deskripsi produk belum tersedia.
              </p>
            </div>
          )}
        </div>

        {/* Product information */}
        <aside className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-5">
            <h3 className="text-lg font-semibold text-gray-950">
              Informasi produk
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Spesifikasi dan identitas produk.
            </p>
          </div>

          <dl className="divide-y divide-gray-100">
            {information.map((item, index) => (
              <div
                key={item.label}
                className={`px-5 py-4 ${
                  index % 2 === 0 ? "bg-gray-50/70" : "bg-white"
                }`}
              >
                <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {item.label}
                </dt>
                <dd className="mt-1.5 break-words text-sm font-semibold text-gray-900">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
};

export default ProductTabs;