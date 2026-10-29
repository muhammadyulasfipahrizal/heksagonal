
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
    className={`group flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:shadow-xl sm:rounded-2xl ${
      isBlack
        ? "border-gray-200 bg-white hover:border-gray-300"
        : "border-white/10 bg-white text-gray-900 hover:border-amber-300/60"
    }`}
  >
    {/* Product image */}
    <Link
      href={productHref}
      aria-label={`Lihat produk ${title}`}
      className="relative block w-full overflow-hidden bg-gray-50"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
        <Image
          src={imageSrc}
          alt={title}
          fill
          sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 1279px) 50vw, 33vw"
          className="object-contain p-3 transition-transform duration-500 group-hover:scale-105 sm:p-5 lg:p-6"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-gray-200/20 to-transparent sm:h-16" />
    </Link>

    {/* Product information */}
    <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4 lg:p-5">
      {/* Brand and variant */}
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2 sm:mb-3">
        <span className="min-w-0 truncate text-[9px] font-bold uppercase tracking-wider text-gray-400 sm:text-[10px] sm:tracking-[0.18em]">
          HEKSAGONAL
        </span>

        {hasVariants && (
          <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[9px] font-semibold text-[#02054b] sm:px-2.5 sm:text-[10px]">
            {variants.length} varian
          </span>
        )}
      </div>

      {/* Product title */}
      <Link href={productHref} className="group/title min-w-0">
        <h3
          className={`line-clamp-2 min-h-10 break-words text-sm font-bold leading-5 transition-colors sm:min-h-12 sm:text-base sm:leading-6 lg:text-lg lg:leading-7 ${
            isBlack
              ? "text-gray-900 group-hover/title:text-blue-800"
              : "text-gray-900 group-hover/title:text-blue-800"
          }`}
        >
          {title}
        </h3>
      </Link>

      {/* Product price */}
      <div className="mt-2 min-w-0 sm:mt-3">
        <p className="mb-1 text-[11px] font-medium text-gray-500 sm:text-xs">
          {hasPrice ? "Harga" : "Harga belum tersedia"}
        </p>

        {hasPrice && (
          <p className="break-words text-base font-extrabold leading-snug tracking-tight text-[#02054b] sm:text-xl lg:text-2xl">
            {formatRupiah(displayPrice)}
          </p>
        )}
      </div>

      {/* Product button */}
      <div className="mt-auto pt-4 sm:pt-5">
        <Link
          href={productHref}
          className="inline-flex min-h-10 w-full min-w-0 items-center justify-center gap-1.5 rounded-lg bg-[#02054b] px-2 py-2 text-xs font-bold text-white transition-colors duration-200 hover:bg-[#111b75] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02054b] focus-visible:ring-offset-2 sm:min-h-11 sm:gap-2 sm:rounded-xl sm:px-3 sm:text-sm"
        >
          <span>Lihat Produk</span>

          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="none"
            className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-1 sm:h-4 sm:w-4"
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
