
import Image from "next/image";
import Link from "next/link";

import { sanitize, formatRupiah } from "@/lib/sanitize";
import { getImageSrc } from "@/lib/utils";

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

  // Gunakan varian aktif dengan harga terendah.
  const availableVariants = variants.filter(
    (variant) =>
      typeof variant.price === "number" &&
      variant.price >= 0
  );

  const cheapestVariant = availableVariants.reduce<
    (typeof availableVariants)[number] | undefined
  >((cheapest, variant) => {
    if (!cheapest || variant.price! < cheapest.price!) {
      return variant;
    }

    return cheapest;
  }, undefined);

  const displayPrice = cheapestVariant?.price ?? product.price;
  const productHref = `/product/${product.slug}`;
  const isBlack = color === "black";

  const title = sanitize(product.title) || "Produk tanpa nama";

  const imageSrc = getImageSrc(
    product.mainImage || "/product_placeholder.jpg"
  );

  const hasPrice =
    typeof displayPrice === "number" && displayPrice >= 0;

  const hasVariants = variants.length > 0;

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isBlack
          ? "border-gray-200 bg-white hover:border-gray-300"
          : "border-white/10 bg-white text-gray-900 hover:border-amber-300/60"
      }`}
    >
      {/* Product image */}
      <Link
        href={productHref}
        aria-label={`Lihat produk ${title}`}
        className="relative block overflow-hidden bg-gray-50"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-contain p-5 transition-transform duration-500 group-hover:scale-105 sm:p-7"
          />
        </div>

        {/* <span className="absolute left-4 top-4 rounded-full border border-gray-200/80 bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#02054b] shadow-sm">
          Produk pilihan
        </span> */}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-gray-200/20 to-transparent" />
      </Link>

      {/* Product information */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
            HEKSAGONAL
          </span>

          {hasVariants && (
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[#02054b]">
              {variants.length} varian
            </span>
          )}
        </div>

        <Link href={productHref} className="group/title">
          <h3
            className={`line-clamp-2 min-h-[2.5rem] text-base font-bold leading-7 transition-colors sm:text-lg ${
              isBlack
                ? "text-gray-900 group-hover/title:text-blue-800"
                : "text-gray-900 group-hover/title:text-blue-800"
            }`}
          >
            {title}
          </h3>
        </Link>

        <div className="mt-2">
          <p className="mb-1 text-xs font-medium text-gray-500">
            {hasPrice ? "Harga" : "Harga belum tersedia"}
          </p>

          {hasPrice && (
            <p className="text-xl font-extrabold tracking-tight text-[#02054b] sm:text-2xl">
              {formatRupiah(displayPrice)}
            </p>
          )}
        </div>

        <div className="mt-auto pt-6">
          <Link
            href={productHref}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#02054b] px-4 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-[#111b75] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02054b] focus-visible:ring-offset-2"
          >
            Lihat Produk
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="none"
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
            >
              <path
                d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ProductItem;
