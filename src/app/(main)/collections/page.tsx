import Link from "next/link";
import { graphqlClient } from "@/lib/graphql/client";
import { GET_PRODUCTS, GET_CATEGORIES } from "@/lib/graphql/queries";
import ProductCard from "@/components/product/ProductCard";
import type { Product, Category } from "@/types";

async function getProducts() {
  try {
    const data = await graphqlClient.request<{ products: { nodes: Product[] } }>(
      GET_PRODUCTS,
      { first: 48, category: null }
    );
    return data.products.nodes;
  } catch (e) {
    return [];
  }
}

async function getCategories() {
  try {
    const data = await graphqlClient.request<{
      productCategories: { nodes: Category[] };
    }>(GET_CATEGORIES);
    return data.productCategories.nodes.filter((c) => c.slug !== "uncategorized");
  } catch (e) {
    return [];
  }
}

export default async function CollectionsPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <div style={{ backgroundColor: "#F8FAF8" }} className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

        <nav className="text-sm text-black/50 mb-4">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          {" / "}
          <span className="text-black">Collections</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">All Products</h1>
          <p className="text-neutral-500 text-sm">{products.length} products</p>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-10">
            <Link href="/collections" className="text-xs font-semibold px-4 py-2 rounded-full border bg-[#538125] text-white border-[#538125]">
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collections/${cat.slug}`}
                className="text-xs font-semibold px-4 py-2 rounded-full border border-neutral-300 text-neutral-600 hover:border-[#538125] hover:text-[#538125] transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-24 text-neutral-400">
            <p className="text-lg font-medium">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} loading={i < 8 ? "eager" : "lazy"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
