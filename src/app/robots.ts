import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/products", "/collections", "/shop"],
      disallow: ["/account", "/checkout", "/api/"],
    },
    sitemap: [
      "https://www.noirblancny.com/sitemap.xml",
      "https://www.noirblancny.com/sitemap-products.xml",
      "https://www.noirblancny.com/sitemap-collections.xml",
    ],
  };
}
