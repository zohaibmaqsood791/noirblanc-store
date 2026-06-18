import { redirect } from "next/navigation";
import { graphqlClient } from "@/lib/graphql/client";
import { GET_PRODUCT_BY_SLUG, GET_PRODUCTS, GET_PRODUCTS_BY_SEARCH } from "@/lib/graphql/queries";
import ProductDetail from "@/components/product/ProductDetail";
import { fetchReviews } from "@/lib/reviews";
import type { Product } from "@/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const data = await graphqlClient.request<{ product: Product }>(
      GET_PRODUCT_BY_SLUG,
      { slug }
    );
    return data.product;
  } catch {
    return null;
  }
}

async function getRelatedProducts(excludeSlug: string): Promise<Product[]> {
  try {
    const data = await graphqlClient.request<{ products: { nodes: Product[] } }>(
      GET_PRODUCTS,
      { first: 8 }
    );
    return data.products.nodes.filter((p) => p.slug !== excludeSlug).slice(0, 4);
  } catch {
    return [];
  }
}

/**
 * Fetch color variant siblings by searching for the first two words of the
 * product name. E.g. "Luma Crossbody Bag Ivory" → search "Luma Crossbody"
 * Returns all matching products (inc. current product so swatch is complete).
 */
async function getColorVariants(productName: string): Promise<Product[]> {
  const words = productName.trim().split(/\s+/);
  const searchTerm = words.slice(0, Math.min(2, words.length)).join(" ");
  try {
    const data = await graphqlClient.request<{ products: { nodes: Product[] } }>(
      GET_PRODUCTS_BY_SEARCH,
      { search: searchTerm, first: 12 }
    );
    return data.products.nodes;
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.shortDescription?.replace(/<[^>]*>/g, "") || product.name,
    openGraph: {
      images: product.image ? [product.image.sourceUrl] : [],
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  // Unknown product (old Shopify URL, renamed/draft) → send to shop instead of 404
  if (!product) redirect("/shop");

  const [relatedProducts, colorVariants, reviews] = await Promise.all([
    getRelatedProducts(slug),
    getColorVariants(product.name),
    fetchReviews(),
  ]);

  return (
    <ProductDetail
      product={product}
      relatedProducts={relatedProducts}
      colorVariants={colorVariants}
      reviews={reviews}
    />
  );
}
