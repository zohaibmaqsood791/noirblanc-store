import type { MetadataRoute } from "next";
import { graphqlClient } from "@/lib/graphql/client";
import { GET_PRODUCTS, GET_CATEGORIES } from "@/lib/graphql/queries";
import type { Product, Category } from "@/types";

const SITE = "https://noirblancnyc.com";

// Public, indexable static routes (excludes /account, /checkout, /api)
const STATIC_PATHS = [
  "",
  "/shop",
  "/collections",
  "/contact",
  "/faq",
  "/size-guide",
  "/shipping-returns",
  "/refund-policy",
  "/privacy-policy",
  "/terms",
  "/track-order",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: p === "" || p === "/shop" ? "daily" : "weekly",
    priority: p === "" ? 1 : p === "/shop" ? 0.9 : 0.5,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  let collectionEntries: MetadataRoute.Sitemap = [];

  try {
    const data = await graphqlClient.request<{ products: { nodes: Product[] } }>(
      GET_PRODUCTS,
      { first: 100, category: null }
    );
    productEntries = (data.products?.nodes ?? [])
      .filter((p) => p.slug)
      .map((p) => ({
        url: `${SITE}/products/${p.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      }));
  } catch (e) {
    console.error("[sitemap] products fetch failed:", e);
  }

  try {
    const data = await graphqlClient.request<{ productCategories: { nodes: Category[] } }>(
      GET_CATEGORIES
    );
    collectionEntries = (data.productCategories?.nodes ?? [])
      .filter((c) => c.slug && c.slug !== "uncategorized")
      .map((c) => ({
        url: `${SITE}/collections/${c.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      }));
  } catch (e) {
    console.error("[sitemap] categories fetch failed:", e);
  }

  return [...staticEntries, ...collectionEntries, ...productEntries];
}
