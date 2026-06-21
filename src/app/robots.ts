import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/products", "/collections", "/shop"],
      disallow: ["/account", "/checkout", "/api/"],
    },
    sitemap: [
      "https://www.noirblancnyc.com/sitemap.xml",
      "https://www.noirblancnyc.com/sitemap-products.xml",
      "https://www.noirblancnyc.com/sitemap-collections.xml",
    ],
  };
}
