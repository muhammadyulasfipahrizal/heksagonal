
type ProductJsonLdProps = {
  product: {
    title: string;
    slug: string;
    description?: string | null;
    price: number;
    mainImage?: string | null;
    inStock: number | boolean;
    code?: string | null;

    // Tambahan untuk SEO rating.
    ratingValue?: number | null;
    ratingCount?: number | null;
  };
};

const SITE_URL = "https://heksagonal.com";

export default function ProductJsonLd({
  product,
}: ProductJsonLdProps) {
  const productUrl = `${SITE_URL}/products/${product.slug}`;

  const image = product.mainImage
    ? /^https?:\/\//i.test(product.mainImage)
      ? product.mainImage
      : new URL(
          `/${product.mainImage.replace(/^\/+/, "")}`,
          SITE_URL
        ).toString()
    : undefined;

  const isInStock =
    typeof product.inStock === "boolean"
      ? product.inStock
      : product.inStock > 0;

  const hasRating =
    typeof product.ratingValue === "number" &&
    Number.isFinite(product.ratingValue) &&
    product.ratingValue >= 1 &&
    product.ratingValue <= 5 &&
    typeof product.ratingCount === "number" &&
    Number.isInteger(product.ratingCount) &&
    product.ratingCount > 0;

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

    ...(hasRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.ratingValue,
            bestRating: 5,
            worstRating: 1,
            ratingCount: product.ratingCount,
          },
        }
      : {}),

    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "IDR",
      price: product.price,
      availability: isInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
