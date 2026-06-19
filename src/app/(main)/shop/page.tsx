import Link from "next/link";
import { graphqlClient } from "@/lib/graphql/client";
import { GET_PRODUCTS, GET_PRODUCTS_BY_SEARCH, GET_CATEGORIES } from "@/lib/graphql/queries";
import ProductCard from "@/components/product/ProductCard";
import type { Product, Category } from "@/types";

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>;
}

async function getProducts(category?: string, q?: string) {
  try {
    if (q) {
      const data = await graphqlClient.request<{ products: { nodes: Product[] } }>(
        GET_PRODUCTS_BY_SEARCH,
        { search: q, first: 48 }
      );
      return data.products.nodes;
    }
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
    const data = await graphqlClient.request<{
      productCategories: { nodes: Category[] };
    }>(GET_CATEGORIES);
    return data.productCategories.nodes.filter((c) => c.slug !== "uncategorized");
  } catch (e) {
    console.error("Failed to fetch categories:", e);
    return [];
  }
}

// Display order on the shop grid: Crossbody bags → other bags → wallets → straps.
// (Strap is checked first so "crossbody strap" sorts as a strap, not a bag.)
function shopOrder(p: Product): number {
  const cats = (p.productCategories?.nodes ?? []).map((c) => `${c.slug} ${c.name}`).join(" ");
  const hay = `${cats} ${p.name}`.toLowerCase();
  if (/strap/.test(hay)) return 3;
  if (/wallet|purse/.test(hay)) return 2;
  if (/cross[\s-]?body/.test(hay)) return 0;
  return 1; // other bags (totes, backpacks, duffels, etc.)
}

export default async function ShopPage({ searchParams }: PageProps) {
  const { category, q } = await searchParams;
  const [products, categories] = await Promise.all([
    getProducts(category, q),
    getCategories(),
  ]);

  // Reorder by category priority (stable — preserves WC order within each group)
  const sortedProducts = [...products].sort((a, b) => shopOrder(a) - shopOrder(b));

  const currentCategory = categories.find((c) => c.slug === category);
  const pageTitle = q
    ? `Search results for “${q}”`
    : currentCategory?.name ?? "All Products";

  return (
    <div style={{ backgroundColor: "#F8FAF8" }} className="min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">

        {/* Breadcrumb */}
        <nav className="text-sm text-black/50 mb-4">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          {" / "}
          <Link href="/shop" className="hover:text-black transition-colors">Collections</Link>
          {currentCategory && (
            <>
              {" / "}
              <span className="text-black">{currentCategory.name}</span>
            </>
          )}
        </nav>

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
            {pageTitle}
          </h1>
          <p className="text-neutral-500 text-sm">{products.length} products</p>
        </div>

        {/* Category filter pills */}
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-10">
            <Link
              href="/shop"
              className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                !category
                  ? "bg-[#538125] text-white border-[#538125]"
                  : "border-neutral-300 text-neutral-600 hover:border-[#538125] hover:text-[#538125]"
              }`}
            >
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-colors ${
                  category === cat.slug
                    ? "bg-[#538125] text-white border-[#538125]"
                    : "border-neutral-300 text-neutral-600 hover:border-[#538125] hover:text-[#538125]"
                }`}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {/* Product grid */}
        {products.length === 0 ? (
          <div className="text-center py-24 text-neutral-400">
            <p className="text-lg font-medium">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {sortedProducts.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                loading={i < 8 ? "eager" : "lazy"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
