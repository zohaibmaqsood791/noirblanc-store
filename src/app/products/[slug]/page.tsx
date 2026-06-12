import { notFound } from "next/navigation";
import { graphqlClient } from "@/lib/graphql/client";
import { GET_PRODUCT_BY_SLUG, GET_PRODUCTS } from "@/lib/graphql/queries";
import ProductDetail from "@/components/product/ProductDetail";
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
  const [product, relatedProducts] = await Promise.all([
    getProduct(slug),
    getRelatedProducts(slug),
  ]);
  if (!product) notFound();
  return <ProductDetail product={product} relatedProducts={relatedProducts} />;
}
