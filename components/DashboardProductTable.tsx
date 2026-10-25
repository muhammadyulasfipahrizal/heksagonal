
"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import CustomButton from "./CustomButton";
import apiClient from "@/lib/api";
import { formatRupiah, sanitize } from "@/lib/sanitize";

type ProductVariant = {
  id: string;
  sku: string | null;
  title: string | null;
  price: number;
  stock: number;
  image: string | null;
  attributes: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
};

type Product = {
  id: string;
  slug: string;
  title: string;
  mainImage: string;
  manufacturer: string;
  price: number;
  inStock: number;
  variants: ProductVariant[];
};

const getProductPriceRange = (variants: ProductVariant[]) => {
  const activeVariants = variants.filter((variant) => variant.isActive);

  if (activeVariants.length === 0) {
    return "—";
  }

  const prices = activeVariants.map((variant) => variant.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return formatRupiah(minPrice);
  }

  return `${formatRupiah(minPrice)} - ${formatRupiah(maxPrice)}`;
};

const DashboardProductTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        const response = await apiClient.get(
          "/api/products?mode=admin",
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Gagal mengambil daftar produk.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error("Format data produk tidak valid.");
        }

        if (!cancelled) {
          setProducts(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Terjadi kesalahan saat mengambil produk."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full">
      <h1 className="mb-5 text-center text-3xl font-semibold">
        Semua Produk
      </h1>

      <div className="mb-5 flex justify-end">
        <Link href="/admin/products/new">
          <CustomButton
            buttonType="button"
            customWidth="110px"
            paddingX={10}
            paddingY={5}
            textSize="base"
            text="Add new product"
          />
        </Link>
      </div>

      <div className="xl:ml-5 max-xl:mt-5 h-[80vh] w-full overflow-auto">
        <table className="table table-md table-pin-cols">
          <thead>
            <tr>
              <th>Product</th>
              <th>Variants</th>
              <th>Stock Availability</th>
              <th>Price Range</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  Memuat produk...
                </td>
              </tr>
            )}

            {!loading && error && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-error">
                  {error}
                </td>
              </tr>
            )}

            {!loading && !error && products.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  Belum ada produk.
                </td>
              </tr>
            )}

            {!loading &&
              !error &&
              products.map((product) => {
                const variants = Array.isArray(product.variants)
                  ? product.variants
                  : [];

                const activeVariants = variants.filter(
                  (variant) => variant.isActive
                );

                const availableVariants = activeVariants.filter(
                  (variant) => variant.stock > 0
                );

                const totalStock = activeVariants.reduce(
                  (total, variant) => total + variant.stock,
                  0
                );

                const isAvailable = availableVariants.length > 0;

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="mask mask-squircle relative h-12 w-12">
                            <Image
                              fill
                              sizes="48px"
                              src={
                                product.mainImage
                                  ? product.mainImage.startsWith("http")
                                    ? product.mainImage
                                    : `/${product.mainImage.replace(/^\/+/, "")}`
                                  : "/product_placeholder.jpg"
                              }
                              alt={
                                sanitize(product.title) || "Product image"
                              }
                              className="object-cover"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="font-bold">
                            {sanitize(product.title)}
                          </div>
                          <div className="text-sm opacity-50">
                            {sanitize(product.manufacturer)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="font-medium">
                        {variants.length} varian
                      </div>
                      <div className="text-xs opacity-60">
                        {activeVariants.length} aktif
                      </div>
                    </td>

                    <td>
                      {activeVariants.length === 0 ? (
                        <span className="badge badge-ghost badge-sm">
                          Tidak aktif
                        </span>
                      ) : isAvailable ? (
                        <div className="flex flex-col items-start gap-1">
                          <span className="badge badge-success badge-sm text-white">
                            Tersedia
                          </span>
                          <span className="text-xs opacity-60">
                            Total stok: {totalStock}
                          </span>
                        </div>
                      ) : (
                        <span className="badge badge-error badge-sm text-white">
                          Habis
                        </span>
                      )}
                    </td>

                    <td>
                      {getProductPriceRange(variants)}
                    </td>

                    <th>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="btn btn-ghost btn-xs"
                      >
                        Details
                      </Link>
                    </th>
                  </tr>
                );
              })}
          </tbody>

          <tfoot>
            <tr>
              <th>Product</th>
              <th>Variants</th>
              <th>Stock Availability</th>
              <th>Price Range</th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default DashboardProductTable;
