
import type { MetadataRoute } from "next";

const SITE_URL = "https://heksagonal.com";
const API_URL = process.env.API_URL;

type Product = {
  slug: string;
  updatedAt?: string;
};

type Category = {
  id: string;
  name: string;
  updatedAt?: string;
};

const createSlug = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/shop`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/categories`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  if (!API_URL) {
    throw new Error("API_URL is not configured");
  }

  const [productsResponse, categoriesResponse] = await Promise.all([
    fetch(`${API_URL}/api/products?status=active`, {
      next: { revalidate: 3600 },
    }),
    fetch(`${API_URL}/api/categories`, {
      next: { revalidate: 3600 },
    }),
  ]);

  if (!productsResponse.ok) {
    throw new Error("Failed to fetch products for sitemap");
  }

  if (!categoriesResponse.ok) {
    throw new Error("Failed to fetch categories for sitemap");
  }

  const products: Product[] = await productsResponse.json();
  const categories: Category[] = await categoriesResponse.json();

  const productPages: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    lastModified: product.updatedAt
      ? new Date(product.updatedAt)
      : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => {
    const slug = createSlug(category.name);

    return {
      url: `${SITE_URL}/shop/${slug}?categoryId=${encodeURIComponent(category.id)}`,
      lastModified: category.updatedAt
        ? new Date(category.updatedAt)
        : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  return [...staticPages, ...productPages, ...categoryPages];
}
