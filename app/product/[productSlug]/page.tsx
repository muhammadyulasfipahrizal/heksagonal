import apiClient from "@/lib/api";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductJsonLd from "./product-json-ld";
import ProductVariantSelector from "@/components/product-variant-selector";
import ProductReview from "@/components/ProductReview";

const SITE_URL = "https://heksagonal.com";

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

interface ImageItem {
  imageID: string;
  productID: string;
  image: string;
}

interface SingleProductPageProps {
  params: Promise<{
    productSlug: string;
  }>;
}

async function getProduct(
  productSlug: string
): Promise<ProductWithVariants | null> {
  // 1. Cari produk berdasarkan slug dari daftar produk.
  const productsResponse = await apiClient.get("/api/products");

  if (!productsResponse.ok) {
    throw new Error("Failed to fetch products");
  }

  const responseData = await productsResponse.json();

  // Endpoint biasa mengembalikan { products, total, page, totalPages }.
  const products: Product[] = Array.isArray(responseData)
    ? responseData
    : responseData.products;

  if (!Array.isArray(products)) {
    throw new Error("Invalid products API response");
  }

  const matchedProduct = products.find(
    (item) => item.slug === productSlug
  );

  if (!matchedProduct) {
    return null;
  }

  // 2. Ambil detail lengkap menggunakan ID produk.
  const detailResponse = await apiClient.get(
    `/api/products/${encodeURIComponent(matchedProduct.id)}`
  );

  if (detailResponse.status === 404) {
    return null;
  }

  if (!detailResponse.ok) {
    throw new Error("Failed to fetch product details");
  }

  const product: ProductWithVariants =
    await detailResponse.json();

  if (!product) {
    return null;
  }

  product.variants = Array.isArray(product.variants)
    ? product.variants
    : [];

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

function getDefaultVariant(product: ProductWithVariants) {
  const activeVariants = (product.variants ?? []).filter(
    (variant) => variant.isActive
  );

  return (
    activeVariants.find((variant) => variant.isDefault) ??
    activeVariants[0] ??
    null
  );
}

function getProductPrice(product: ProductWithVariants): number {
  return getDefaultVariant(product)?.price ?? product.price ?? 0;
}

function isProductAvailable(product: ProductWithVariants): boolean {
  return (product.variants ?? []).some(
    (variant) => variant.isActive && variant.stock > 0
  );
}

function getImageUrl(image?: string | null): string | undefined {
  if (!image) return undefined;

  if (/^https?:\/\//i.test(image)) {
    return image;
  }

  return new URL(`/${image.replace(/^\/+/, "")}`, SITE_URL).toString();
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

  const keywords = product.keywords?.trim()
    ? [
        ...new Set(
          product.keywords
            .split(",")
            .map((keyword) => keyword.trim())
            .filter(Boolean)
        ),
      ].join(", ")
    : `${product.title} ${description}`;

  const canonicalPath = `/products/${product.slug}`;
  const imageUrl = getImageUrl(
    getDefaultVariant(product)?.image || product.mainImage
  );

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
      ...(imageUrl
        ? { images: [{ url: imageUrl, alt: product.title }] }
        : {}),
    },
  };
}

export default async function SingleProductPage({
  params,
}: SingleProductPageProps) {
  const { productSlug } = await params;

  const product = await getProduct(productSlug);

  if (!product) {
    notFound();
  }

  const images = await getProductImages(String(product.id));

  // Provide default-variant values to server-rendered structured data.
  const defaultVariant = getDefaultVariant(product);

  const jsonLdProduct = {
    ...product,
    price: getProductPrice(product),
    inStock: isProductAvailable(product) ? 1 : 0,
    mainImage: defaultVariant?.image || product.mainImage,
    ratingValue: product.ratingValue ?? null,
    ratingCount: product.ratingCount ?? null,
  };

  return (
    <div className="bg-white">
      <ProductJsonLd product={jsonLdProduct} />

      <ProductVariantSelector
        product={product}
        images={images}
      />

      <ProductReview productId={product.id} />
    </div>
  );
}