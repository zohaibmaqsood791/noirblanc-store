import type { MetadataRoute } from "next";

// The headless store is a checkout destination behind the Shopify storefront,
// not a search surface. Crawling is left allowed (so bots can read the site-wide
// `noindex` meta set in layout.tsx); we just don't advertise a sitemap/host.
// Disallowing everything here would block crawlers from ever seeing the noindex.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/checkout", "/api/"],
    },
  };
}
