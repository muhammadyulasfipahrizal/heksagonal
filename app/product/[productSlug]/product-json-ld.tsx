
type ProductJsonLdProps = {
  product: {
    title: string;
    slug: string;
    description?: string | null;
    price: number;
    mainImage?: string | null;
    inStock: number | boolean;
    code?: string | null;
  };
};

const SITE_URL = "https://heksagonal.com";

export default function ProductJsonLd({
  product,
}: ProductJsonLdProps) {
  const productUrl = `${SITE_URL}/products/${product.slug}`;

  const image = product.mainImage
    ? new URL(product.mainImage, SITE_URL).toString()
    : undefined;

  // Mendukung boolean dan angka: 1 = tersedia, 0 = habis.
  const isInStock =
    typeof product.inStock === "boolean"
      ? product.inStock
      : product.inStock > 0;

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
