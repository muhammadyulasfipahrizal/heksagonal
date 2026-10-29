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
import Link from "next/link";
import { getImageSrc } from "@/lib/utils";

type ProductVariant = {
  id: string;
  productId: string;
  title: string | null;
  price: number | null;
  stock: number;
  image: string | null;
  isDefault: boolean;
  isActive: boolean;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type ProductWithVariants = Omit<Product, "variants"> & {
  variants: ProductVariant[];
  ratingValue?: number | null;
  ratingCount?: number | null;
};

interface ProductVariantSelectorProps {
  product: ProductWithVariants;
  images: {
    imageID: string;
    productID: string;
    image: string;
  }[];
}

function getVariantLabel(variant: ProductVariant) {
  if (variant.title?.trim()) return variant.title.trim();
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
    price: selectedVariant?.price,
    description: selectedVariant?.description,
    inStock:
      selectedVariant != null
        ? selectedVariant.stock > 0
          ? 1
          : 0
        : product.inStock,
    mainImage: selectedVariant?.image || product.mainImage,
    // code: selectedVariant?.sku ?? null,
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
    <main className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-10">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 sm:mb-6 sm:text-sm"
      >
        <Link
          href="/"
          className="shrink-0 transition hover:text-gray-900"
        >
          Beranda
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href="/products"
          className="shrink-0 transition hover:text-gray-900"
        >
          Produk
        </Link>
        <span aria-hidden="true">/</span>
        <span className="min-w-0 flex-1 break-words font-medium text-gray-800 sm:line-clamp-1">
          {sanitize(product.title)}
        </span>
      </nav>

        
        {/* {typeof product.ratingValue === "number" &&
          Number.isFinite(product.ratingValue) &&
          product.ratingValue >= 1 &&
          product.ratingValue <= 5 &&
          typeof product.ratingCount === "number" &&
          product.ratingCount > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 sm:mb-6">
              <span
                aria-hidden="true"
                className="text-base tracking-wide text-yellow-500 sm:text-lg"
              >
                ★
              </span>

              <span className="text-sm font-semibold text-gray-900">
                {product.ratingValue.toFixed(1)} / 5
              </span>

              <span className="text-xs text-gray-500 sm:text-sm">
                ({product.ratingCount} penilaian)
              </span>
            </div>
          )} */}


      {/* Product overview */}
      <section className="grid min-w-0 grid-cols-1 items-start gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Left: Product gallery */}
        <div className="min-w-0">
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:rounded-2xl">
            <Image
              key={selectedImage}
              src={getImageSrc(selectedImage)}
              alt={sanitize(product.title)}
              fill
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 50vw"
              className="object-contain p-4 sm:p-8"
            />

            {selectedVariant && (
              <span className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-gray-700 shadow-sm sm:left-4 sm:top-4 sm:text-xs">
                {selectedVariant.isDefault ? "Varian utama" : "Varian produk"}
              </span>
            )}
          </div>

          {/* Thumbnail */}
          {galleryImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 sm:mt-4 sm:gap-3">
              {galleryImages.map((image, index) => {
                const isSelected = selectedImage === image;

                return (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageOverride(image)}
                    aria-label={`Lihat gambar produk ${index + 1}`}
                    aria-pressed={isSelected}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-gray-50 transition sm:h-24 sm:w-24 sm:rounded-xl ${
                      isSelected
                        ? "border-gray-900 ring-2 ring-gray-900/10"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <Image
                      src={getImageSrc(image)}
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
          <div className="border-b border-gray-200 pb-5 sm:pb-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-500 sm:mb-3 sm:text-xs">
              Detail produk
            </p>

            <h1 className="break-words text-2xl font-bold leading-tight tracking-tight text-gray-950 sm:text-3xl lg:text-4xl">
              {sanitize(product.title)}
            </h1>

            <div className="mt-4 rounded-xl bg-gray-50 p-4 sm:mt-6 sm:p-5">
              <p className="mb-1 text-xs text-gray-500 sm:text-sm">
                Harga produk
              </p>

              <p className="break-words text-2xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                {formatRupiah(selectedProduct.price)}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                {/* Stock status */}
                <div
                  className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-2 text-xs font-medium sm:text-sm ${
                    isAvailable
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      isAvailable ? "bg-green-500" : "bg-red-500"
                    }`}
                  />

                  <span className="break-words">
                    {typeof stock === "number"
                      ? stock > 0
                        ? `Stok: ${stock} unit`
                        : "Stok habis"
                      : isAvailable
                        ? "Tersedia"
                        : "Tidak tersedia"}
                  </span>
                </div>

                {/* Wishlist */}
                <div className="flex shrink-0 items-center">
                  <AddToWishlistBtn
                    product={{
                      id: product.id,
                      title: product.title,
                      mainImage: product.mainImage ?? "",
                      slug: product.slug,
                      stockAvailabillity: selectedProduct.inStock,
                      variants: [
                        {
                          id: selectedProduct.id,
                          title: selectedProduct.title ?? null,
                          price: selectedProduct.price,
                          image: selectedProduct.mainImage ?? null,
                          isDefault: true,
                        },
                      ],
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Variant selection */}
          {variants.length > 0 && (
            <div className="border-b border-gray-200 py-5 sm:py-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-gray-900 sm:text-base">
                  Pilih varian
                </h2>

                <span className="text-xs text-gray-500">
                  {variants.length} pilihan
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
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
                      className={`min-w-0 rounded-xl border p-3 text-left transition sm:p-4 ${
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

                          <p className="mt-2 break-words text-sm font-bold text-gray-950 sm:text-base">
                            {formatRupiah(variant.price ?? product.price ?? 0)}
                          </p>

                          <p
                            className={`mt-1 text-xs ${
                              variantInStock ? "text-gray-500" : "text-red-600"
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

          {/* Dynamic product fields */}
          <div className="min-w-0 border-b border-gray-200 py-5 sm:py-6">
            <SingleProductDynamicFields
              product={selectedProduct}
              selectedVariant={
                selectedVariant
                  ? {
                      id: selectedVariant.id,
                      title: selectedVariant.title,
                      price: selectedVariant.price ?? product.price ?? 0,
                      image: selectedVariant.image,
                    }
                  : null
              }
            />
          </div>

          {/* Social sharing */}
          <div className="flex flex-wrap items-center gap-3 border-t border-gray-200 pt-5">
            <span className="w-full text-xs text-gray-500 sm:w-auto sm:text-sm">
              Bagikan produk:
            </span>

            <Link
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Bagikan ke Facebook"
              className="text-gray-400 transition hover:text-blue-600"
            >
              <FaSquareFacebook size={23} />
            </Link>

            <Link
              href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(productUrl)}&media=${encodeURIComponent(shareImageUrl)}&description=${encodeURIComponent(sanitize(product.title))}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Bagikan ke Pinterest"
              className="text-gray-400 transition hover:text-red-600"
            >
              <FaSquarePinterest size={23} />
            </Link>

            <Link
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(sanitize(product.title))}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Bagikan ke X"
              className="text-gray-400 transition hover:text-gray-900"
            >
              <FaSquareXTwitter size={23} />
            </Link>
          </div>
        </div>
      </section>

      {/* Product details tabs */}
      <section className="mt-8 min-w-0 sm:mt-12 lg:mt-16">
        <ProductTabs product={selectedProduct} />
      </section>

    </main>
  );
}