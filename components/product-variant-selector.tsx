"use client";

import {
  AddToWishlistBtn,
  ProductTabs,
  SingleProductDynamicFields,
  StockAvailabillity,
} from "@/components";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  FaSquareFacebook,
  FaSquarePinterest,
  FaSquareXTwitter,
} from "react-icons/fa6";
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

type ProductWithVariants = Product & {
  variants?: ProductVariant[];
};

interface ProductVariantSelectorProps {
  product: ProductWithVariants;
  images: {
    imageID: string;
    productID: string;
    image: string;
  }[];
}

function getImageSrc(image?: string | null) {
  if (!image) return "/product_placeholder.jpg";
  if (/^https?:\/\//i.test(image)) return image;
  return `/${image.replace(/^\/+/, "")}`;
}

function getVariantLabel(variant: ProductVariant) {
  if (variant.title?.trim()) return variant.title.trim();

  const attributes = Object.entries(variant.attributes ?? {})
    .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
    .map(([key, value]) => `${key}: ${String(value)}`);

  return attributes.join(" · ") || variant.sku || "Varian produk";
}

export default function ProductVariantSelector({
  product,
  images,
}: ProductVariantSelectorProps) {
  const variants = useMemo(
    () => (product.variants ?? []).filter((variant) => variant.isActive),
    [product.variants]
  );

  const initialVariant =
    variants.find((variant) => variant.isDefault) ?? variants[0] ?? null;

  const [selectedVariantId, setSelectedVariantId] = useState(
    initialVariant?.id ?? ""
  );
  const [selectedImageOverride, setSelectedImageOverride] = useState<
    string | null
  >(null);

  const selectedVariant =
    variants.find((variant) => variant.id === selectedVariantId) ??
    initialVariant;

  const selectedProduct = {
    ...product,
    price: selectedVariant?.price ?? product.price,
    inStock:
      selectedVariant != null
        ? selectedVariant.stock > 0
          ? 1
          : 0
        : product.inStock,
    mainImage: selectedVariant?.image || product.mainImage,
    code: selectedVariant?.sku ?? null,
  } as Product;

  const defaultImage = getImageSrc(
    selectedVariant?.image || product.mainImage
  );

  const selectedImage = selectedImageOverride ?? defaultImage;

  const galleryImages = useMemo(() => {
    const candidates = [
      selectedVariant?.image || product.mainImage,
      product.mainImage,
      ...images.map((item) => item.image),
    ];

    return [...new Set(candidates.filter(Boolean).map(getImageSrc))];
  }, [selectedVariant?.image, product.mainImage, images]);

  const attributeEntries = Object.entries(
    selectedVariant?.attributes ?? {}
  ).filter(
    ([, value]) =>
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ""
  );

  const stock = selectedVariant?.stock;
  const isAvailable =
    selectedVariant != null
      ? selectedVariant.stock > 0
      : Boolean(product.inStock);

  const productUrl = `https://heksagonal.com/products/${product.slug}`;
  const shareImageUrl = /^https?:\/\//i.test(selectedImage)
    ? selectedImage
    : `https://heksagonal.com${selectedImage}`;

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariantId(variant.id);
    setSelectedImageOverride(null);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <a href="/" className="transition hover:text-gray-900">
          Beranda
        </a>
        <span>/</span>
        <a href="/products" className="transition hover:text-gray-900">
          Produk
        </a>
        <span>/</span>
        <span className="line-clamp-1 font-medium text-gray-800">
          {sanitize(product.title)}
        </span>
      </nav>

      {/* Product overview */}
      <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left: Product gallery */}
        <div className="min-w-0">
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:p-8">
            <Image
              key={selectedImage}
              src={selectedImage}
              alt={sanitize(product.title)}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-5 transition duration-300 sm:p-8"
            />

            {selectedVariant && (
              <span className="absolute left-4 top-4 z-10 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                {selectedVariant.isDefault ? "Varian utama" : "Varian produk"}
              </span>
            )}
          </div>

          {/* Clickable thumbnails */}
          {galleryImages.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {galleryImages.map((image, index) => {
                const isSelected = selectedImage === image;

                return (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageOverride(image)}
                    aria-label={`Lihat gambar produk ${index + 1}`}
                    aria-pressed={isSelected}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-gray-50 transition sm:h-24 sm:w-24 ${
                      isSelected
                        ? "border-gray-900 ring-2 ring-gray-900/10"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Gambar produk ${index + 1}`}
                      fill
                      sizes="96px"
                      className="object-contain p-2"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Product information */}
        <div className="min-w-0">
          <div className="border-b border-gray-200 pb-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Detail produk
            </p>

            <h1 className="text-2xl font-bold leading-tight tracking-tight text-gray-950 sm:text-3xl lg:text-4xl">
              {sanitize(product.title)}
            </h1>

            {product.manufacturer && (
              <p className="mt-3 text-sm text-gray-500">
                Merek:{" "}
                <span className="font-medium text-gray-800">
                  {product.manufacturer}
                </span>
              </p>
            )}

            <div className="mt-6 rounded-xl bg-gray-50 px-4 py-5 sm:px-5">
              <p className="mb-1 text-sm text-gray-500">Harga produk</p>
              <p className="text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                {formatRupiah(selectedProduct.price)}
              </p>
              <div className="mt-3">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    isAvailable
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isAvailable ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {isAvailable ? "Tersedia" : "Stok habis"}
                </span>
              </div>
            </div>
          </div>

          {/* Variant selection */}
          {variants.length > 0 && (
            <div className="border-b border-gray-200 py-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-gray-900">
                  Pilih varian
                </h2>
                <span className="text-xs text-gray-500">
                  {variants.length} pilihan
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const variantInStock = variant.stock > 0;

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={!variantInStock}
                      onClick={() => handleSelectVariant(variant)}
                      aria-pressed={isSelected}
                      className={`relative rounded-xl border p-4 text-left transition ${
                        isSelected
                          ? "border-gray-900 bg-gray-50 ring-1 ring-gray-900"
                          : "border-gray-200 bg-white hover:border-gray-400"
                      } ${
                        !variantInStock
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-gray-900">
                            {getVariantLabel(variant)}
                          </p>
                          <p className="mt-2 text-base font-bold text-gray-950">
                            {formatRupiah(variant.price)}
                          </p>
                          <p
                            className={`mt-1 text-xs ${
                              variantInStock
                                ? "text-gray-500"
                                : "text-red-600"
                            }`}
                          >
                            {variantInStock
                              ? `Stok: ${variant.stock}`
                              : "Stok habis"}
                          </p>
                        </div>

                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              viewBox="0 0 20 20"
                              fill="none"
                              className="h-3 w-3"
                              aria-hidden="true"
                            >
                              <path
                                d="m4 10 4 4 8-8"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock and attributes */}
          <div className="flex flex-col gap-y-3 border-b border-gray-200 py-6">
            <div className="flex flex-col gap-4 rounded-xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">

                    <AddToWishlistBtn
                    product={{
                        id: product.id,
                        title: product.title,
                        price: selectedProduct.price,
                        image: selectedProduct.mainImage ?? "",
                        slug: product.slug,
                        stockAvailabillity: selectedProduct.inStock,
                    }}
                    />
                </div>

                {typeof stock === "number" && (
                    <div
                    className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-sm font-medium ${
                        stock > 0
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                    >
                    <span
                        className={`h-2 w-2 rounded-full ${
                        stock > 0 ? "bg-green-500" : "bg-red-500"
                        }`}
                    />

                    {stock > 0 ? `Stok: ${stock} unit` : "Stok habis"}
                    </div>
                )}
                </div>

            {attributeEntries.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold text-gray-900">
                  Spesifikasi varian
                </h2>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                  {attributeEntries.map(([key, value], index) => (
                    <div
                      key={key}
                      className={`grid grid-cols-2 gap-4 px-4 py-3 text-sm ${
                        index % 2 === 0 ? "bg-gray-50" : "bg-white"
                      }`}
                    >
                      <span className="break-words text-gray-500">
                        {key.replace(/[_-]/g, " ")}
                      </span>
                      <span className="break-words font-medium text-gray-900">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dynamic product fields */}
          <div className="border-b border-gray-200 py-6">
            <SingleProductDynamicFields product={selectedProduct} />
          </div>

          {/* Wishlist and SKU */}
          {/* <div className="flex flex-wrap items-center justify-between gap-4 py-5">

            <div className="text-gray-500">
              <p>
                SKU:{" "}
                <span className="font-medium text-gray-800">
                  {selectedVariant?.sku || product.code || "-"}
                </span>
              </p>
              {selectedVariant && (
                <p className="mt-1">
                  ID varian:{" "}
                  <span className="font-medium text-gray-800">
                    {selectedVariant.id}
                  </span>
                </p>
              )}
            </div>
          </div> */}

          {/* Social sharing */}
          <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-5">
            <span className="text-sm text-gray-500">Bagikan produk:</span>

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Bagikan ke Facebook"
              className="text-gray-400 transition hover:text-blue-600"
            >
              <FaSquareFacebook size={23} />
            </a>

            <a
              href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&media=${encodeURIComponent(shareImageUrl)}&description=${encodeURIComponent(sanitize(product.title))}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Bagikan ke Pinterest"
              className="text-gray-400 transition hover:text-red-600"
            >
              <FaSquarePinterest size={23} />
            </a>

            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(sanitize(product.title))}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Bagikan ke X"
              className="text-gray-400 transition hover:text-gray-900"
            >
              <FaSquareXTwitter size={23} />
            </a>
          </div>
        </div>
      </section>

      {/* Product details tabs */}
      <section className="mt-12 border-t border-gray-200 pt-8 sm:mt-16">
        <ProductTabs product={selectedProduct} />
      </section>
    </main>
  );
}