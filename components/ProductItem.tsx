import Image from "next/image";
import React from "react";
import Link from "next/link";

import { sanitize, formatRupiah } from "@/lib/sanitize";

const ProductItem = ({
  product,
  color,
}: {
  product: Product;
  color: string;
}) => {
  const variants = Array.isArray(product.variants)
    ? product.variants
    : [];

  const cheapestVariant = variants.reduce<
    (typeof variants)[number] | undefined
  >((cheapest, variant) => {
    if (variant.price == null) return cheapest;

    if (!cheapest || variant.price < cheapest.price) {
      return variant;
    }

    return cheapest;
  }, undefined);

  const displayPrice = cheapestVariant?.price ?? product.price;

  return (
    <div className="flex flex-col items-center gap-y-2">
      <Link href={`/product/${product.slug}`}>
        <Image
          src={
            product.mainImage
              ? `/${product.mainImage}`
              : "/product_placeholder.jpg"
          }
          width={0}
          height={0}
          sizes="100vw"
          className="w-auto h-[300px]"
          alt={sanitize(product?.title) || "Product image"}
        />
      </Link>

      <Link
        href={`/product/${product.slug}`}
        className={
          color === "black"
            ? "text-xl text-black font-normal mt-2 uppercase"
            : "text-xl text-white font-normal mt-2 uppercase"
        }
      >
        {sanitize(product.title)}
      </Link>

      <p
        className={
          color === "black"
            ? "text-lg text-black font-semibold"
            : "text-lg text-white font-semibold"
        }
      >
        {formatRupiah(displayPrice)}
      </p>

      <Link
        href={`/product/${product.slug}`}
        className="flex w-full items-center justify-center border border-gray-300 bg-white px-0 py-2 text-base font-bold uppercase text-[#02054b] shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2"
      >
        <p>Lihat Produk</p>
      </Link>
    </div>
  );
};

export default ProductItem;