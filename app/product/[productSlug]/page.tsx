
import {
  StockAvailabillity,
  ProductTabs,
  SingleProductDynamicFields,
  AddToWishlistBtn,
} from "@/components";

import apiClient from "@/lib/api";
import Image from "next/image";
import { notFound } from "next/navigation";
import { FaSquareFacebook, FaSquarePinterest, FaSquareXTwitter } from "react-icons/fa6";
import { formatRupiah, sanitize } from "@/lib/sanitize";
import type { Metadata } from "next";
import ProductJsonLd from "./product-json-ld";

const SITE_URL = "https://heksagonal.com";

interface ImageItem {
  imageID: string;
  productID: string;
  image: string;
}

interface SingleProductPageProps {
  params: Promise<{
    productSlug: string;
    id: string;
  }>;
}

async function getProduct(
  productSlug: string
): Promise<Product | null> {
  const response = await apiClient.get(
    `/api/slugs/${encodeURIComponent(productSlug)}`
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch product");
  }

  const product: Product = await response.json();

  if (!product) {
    return null;
  }

  return product;
}

async function getProductImages(
  productId: string
): Promise<ImageItem[]> {
  const response = await apiClient.get(
    `/api/images/${encodeURIComponent(productId)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch product images");
  }

  return response.json();
}

function getImageSrc(image?: string | null): string {
  if (!image) {
    return "/product_placeholder.jpg";
  }

  // Support absolute URLs and local public assets.
  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return `/${image.replace(/^\/+/, "")}`;
}

function generateKeywords(description?: string | null): string[] {
  if (!description) return [];

  const stopWords = new Set([
    "dan", "atau", "yang", "di", "ke", "dari", "untuk",
    "dengan", "pada", "ini", "itu", "adalah", "dalam",
    "the", "and", "or", "of", "for", "with", "in", "on",
  ]);

  return [
    ...new Set(
      description
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/\s+/g, " ")
        .toLowerCase()
        .match(/[\p{L}\p{N}-]+/gu)
        ?.filter((word) => word.length > 2 && !stopWords.has(word)) ?? [],
    ),
  ].slice(0, 15);
}

export async function generateMetadata({
  params,
}: SingleProductPageProps): Promise<Metadata> {
  const { productSlug } = await params;
  const product = await getProduct(productSlug);

  if (!product) {
    return {
      title: "Produk tidak ditemukan | HEKSAGONAL",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    product.description?.replace(/\s+/g, " ").trim().slice(0, 155) ||
    `Lihat detail, harga, dan informasi ${product.title} di HEKSAGONAL.`;

  const keywords = generateKeywords(
  `${product.title} ${description}`,
  );

  const canonicalPath = `/products/${product.slug}`;

  const imageUrl = product.mainImage
    ? getImageSrc(product.mainImage)
    : undefined;

  const productUrl = `${SITE_URL}/products/${product.slug}`;

  const image = product.mainImage
    ? new URL(product.mainImage, SITE_URL).toString()
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    url: productUrl,
    ...(product.description
      ? {
          description: product.description
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
        }
      : {}),
    ...(image ? { image: [image] } : {}),
    ...(product.code ? { sku: product.code } : {}),
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "IDR",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return {
    title: product.title,
    description,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      title: `${product.title} | HEKSAGONAL`,
      description,
      url: canonicalPath,
      siteName: "HEKSAGONAL",
      ...(imageUrl ? { images: [{ url: imageUrl, alt: product.title }] } : {}),
    },
  };
}

export default async function SingleProductPage({
  params,
}: SingleProductPageProps) {
  const { productSlug, id } = await params;

  const product = await getProduct(productSlug);

  if (!product) {
    notFound();
  }

  const images = await getProductImages(id);

  const mainImageSrc = getImageSrc(product.mainImage);

  return (
    <div className="bg-white">
      <ProductJsonLd product={product} />
      <div className="mx-auto max-w-screen-2xl">
        <div className="flex items-center justify-center gap-x-16 gap-y-5 px-5 pt-10 max-lg:flex-col">
          <div>
            <Image
              src={mainImageSrc}
              width={500}
              height={500}
              alt={`Foto produk ${product.title}`}
              className="h-auto w-auto"
              priority
            />

            <div className="mt-5 flex flex-wrap justify-around gap-y-1 max-[500px]:justify-center max-[500px]:gap-x-1">
              {images.map((imageItem) => (
                <Image
                  key={imageItem.imageID}
                  src={getImageSrc(imageItem.image)}
                  width={100}
                  height={100}
                  alt={`Foto tambahan ${product.title}`}
                  className="h-auto w-auto"
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-y-7 text-black max-[500px]:text-center">
            <h1 className="text-3xl">{sanitize(product.title)}</h1>

            <p className="text-xl font-semibold">
              {formatRupiah(product.price)}
            </p>

            <StockAvailabillity
              stock={94}
              inStock={product.inStock}
            />

            <SingleProductDynamicFields product={product} />

            <div className="flex flex-col gap-y-2 max-[500px]:items-center">
              <AddToWishlistBtn
                product={{
                  id: product.id,
                  title: product.title,
                  price: product.price,
                  image: product.mainImage ?? "",
                  slug: product.slug,
                  stockAvailabillity: product.inStock,
                }}
              />

              <p className="text-lg">
                SKU: <span className="ml-1">{product.code}</span>
              </p>

              <p className="text-lg">
                Berat: <span className="ml-1">{product.weight} KG</span>
              </p>

              <div className="flex gap-x-2 text-lg">
                <span>Bagikan:</span>

                <div className="flex items-center gap-x-1 text-2xl">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      `https://domainkamu.com/products/${product.slug}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Bagikan ke Facebook"
                  >
                    <FaSquareFacebook />
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                      `https://domainkamu.com/products/${product.slug}`
                    )}&text=${encodeURIComponent(product.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Bagikan ke X"
                  >
                    <FaSquareXTwitter />
                  </a>

                  <a
                    href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
                      `https://domainkamu.com/products/${product.slug}`
                    )}&media=${encodeURIComponent(
                      `https://domainkamu.com${mainImageSrc}`
                    )}&description=${encodeURIComponent(product.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Bagikan ke Pinterest"
                  >
                    <FaSquarePinterest />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="py-16">
          <ProductTabs product={product} />
        </div>
      </div>
    </div>
  );
}
