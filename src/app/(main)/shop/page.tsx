import { graphqlClient } from "@/lib/graphql/client";
import { GET_PRODUCTS, GET_CATEGORIES } from "@/lib/graphql/queries";
import ProductCard from "@/components/product/ProductCard";
import type { Product, Category } from "@/types";

interface PageProps {
  searchParams: Promise<{ category?: string }>;
}

async function getProducts(category?: string) {
  try {
    const data = await graphqlClient.request<{ products: { nodes: Product[] } }>(
      GET_PRODUCTS,
      { first: 48, category: category || null }
    );
    return data.products.nodes;
  } catch (e) {
    console.error("Failed to fetch products:", e);
    return [];
  }
}

async function getCategories() {
  try {
    const data = await graphqlClient.request<{ productCategories: { nodes: Category[] } }>(
      GET_CATEGORIES
    );
    // Filter out "Uncategorized"
    return data.productCategories.nodes.filter((c) => c.slug !== "uncategorized");
  } catch (e) {
    console.error("Failed to fetch categories:", e);
    return [];
  }
}

export default async function ShopPage({ searchParams }: PageProps) {
  const { category } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(category),
    getCategories(),
  ]);

  const currentCategory = categories.find((c) => c.slug === category);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight">
          {currentCategory ? currentCategory.name : "All Products"}
        </h1>
        <p className="text-neutral-500 mt-2 text-sm">{products.length} products</p>
      </div>

      {/* Category filters */}
      {categories.length > 0 && (
        <div className="flex gap-3 flex-wrap mb-10">
          <a
            href="/shop"
            className={`text-xs font-medium px-4 py-2 border rounded-full transition-colors ${
              !category
                ? "bg-black text-white border-black"
                : "border-neutral-300 text-neutral-600 hover:border-black"
            }`}
          >
            All
          </a>
          {categories.map((cat) => (
            <a
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className={`text-xs font-medium px-4 py-2 border rounded-full transition-colors ${
                category === cat.slug
                  ? "bg-black text-white border-black"
                  : "border-neutral-300 text-neutral-600 hover:border-black"
              }`}
            >
              {cat.name}
            </a>
          ))}
        </div>
      )}

      {/* Grid */}
      {products.length === 0 ? (
        <div className="text-center py-24 text-neutral-400">
          <p className="text-lg">No products found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
