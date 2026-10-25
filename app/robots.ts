import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/checkout/",
        "/account/",
        "/api/",
      ],
    },
    sitemap: "https://heksagonal.com/sitemap.xml",
  };
}