import type { MetadataRoute } from "next";

const SITE = "https://noirblancnyc.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private / non-indexable areas
      disallow: ["/account", "/checkout", "/api/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
