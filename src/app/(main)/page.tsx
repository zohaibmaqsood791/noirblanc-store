import Image from "next/image";
import Link from "next/link";
import { graphqlClient } from "@/lib/graphql/client";
import { GET_PRODUCTS, GET_CATEGORIES } from "@/lib/graphql/queries";
import ProductCard from "@/components/product/ProductCard";
import type { Product, Category } from "@/types";

const features = [
  { title: "Comfort First", description: "Adjustable straps and lightweight design for all-day wear." },
  { title: "Generous Capacity", description: "Fits your essentials — cards, phone, keys — without the bulk." },
  { title: "Tech-Friendly", description: "Dedicated pockets for your devices, always within reach." },
  { title: "Weather Resistant", description: "Coated materials that stand up to whatever the day brings." },
];

async function getFeaturedProducts() {
  try {
    const data = await graphqlClient.request<{ products: { nodes: Product[] } }>(
      GET_PRODUCTS,
      { first: 8 }
    );
    return data.products.nodes;
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    const data = await graphqlClient.request<{ productCategories: { nodes: Category[] } }>(
      GET_CATEGORIES
    );
    return data.productCategories.nodes.filter((c) => c.slug !== "uncategorized").slice(0, 3);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative h-[90vh] min-h-[600px] bg-neutral-100 overflow-hidden">
        <Image
          src="https://noirblancnyc.com/cdn/shop/files/hf_20260419_074456_069633e7-c7a8-4655-b052-bedc772e8603.png"
          alt="Noir & Blanc Hero"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
          <p className="text-sm tracking-[0.3em] uppercase mb-4 font-body opacity-90">New Collection</p>
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-3xl leading-none">
            Your Style,<br />Upgraded
          </h1>
          <p className="text-lg opacity-80 mb-8 max-w-md font-body font-light">
            Premium accessories crafted for the modern woman.
          </p>
          <Link
            href="/shop"
            className="bg-white text-black text-sm font-semibold px-8 py-3.5 tracking-widest uppercase hover:bg-neutral-100 transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Announcement bar */}
      <div className="bg-black text-white text-center py-2.5">
        <p className="text-xs tracking-widest uppercase font-body">
          Free shipping on orders over $75 · Use code NOIR10 for 10% off
        </p>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="font-heading text-3xl font-bold text-center mb-12 tracking-tight">
            Shop by Category
          </h2>
          <div className={`grid grid-cols-1 gap-6 ${categories.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="group relative overflow-hidden bg-neutral-100 rounded" style={{ paddingBottom: "100%", height: 0 }}
              >
                {cat.image ? (
                  <Image
                    src={cat.image.sourceUrl}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-200" />
                )}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                <div className="absolute inset-0 flex items-end p-6">
                  <div>
                    <h3 className="font-heading text-white text-xl font-semibold tracking-wide">{cat.name}</h3>
                    <p className="text-white/70 text-xs mt-1">{cat.count} products</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="bg-[#f9f7f4] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-heading text-3xl font-bold tracking-tight">Best Sellers</h2>
            <Link href="/shop" className="text-sm underline underline-offset-4 hover:opacity-60 transition-opacity">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="font-heading text-3xl font-bold text-center mb-14 tracking-tight">
          What Makes It Your Go-To Bag
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f) => (
            <div key={f.title} className="text-center">
              <div className="w-12 h-12 rounded-full bg-black mx-auto mb-4 flex items-center justify-center">
                <Image
                  src="https://noirblancnyc.com/cdn/shop/files/Union_1.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="brightness-0 invert"
                />
              </div>
              <h3 className="font-heading font-semibold text-base mb-2">{f.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-black text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-heading text-3xl font-bold mb-12 tracking-tight">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { quote: "The quality is unreal. I use it every single day.", name: "Sarah M." },
              { quote: "Finally a bag that fits everything without being bulky.", name: "Jessica T." },
              { quote: "Ordered in Ivory and it goes with literally everything.", name: "Priya K." },
            ].map((t) => (
              <div key={t.name} className="text-left">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-neutral-300 text-sm leading-relaxed mb-3">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-sm font-semibold">{t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
