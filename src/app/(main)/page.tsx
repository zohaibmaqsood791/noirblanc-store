import Image from "next/image";
import Link from "next/link";
import { graphqlClient } from "@/lib/graphql/client";
import { GET_PRODUCTS } from "@/lib/graphql/queries";
import ProductCard from "@/components/product/ProductCard";
import Carousel from "@/components/home/Carousel";
import UGCStrip from "@/components/home/UGCStrip";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

/* ─── Data ──────────────────────────────────────────────────────────────── */
async function getProducts(first = 8): Promise<Product[]> {
  try {
    const data = await graphqlClient.request<{ products: { nodes: Product[] } }>(
      GET_PRODUCTS, { first }
    );
    return data.products.nodes;
  } catch { return []; }
}

/* ─── Category tiles ────────────────────────────────────────────────────── */
const CATEGORIES = [
  { label: "Crossbody Bags", href: "/shop?category=crossbody-bags", emoji: "👜" },
  { label: "Bag Straps",     href: "/shop?category=bag-straps",     emoji: "🎀" },
  { label: "Wallets",        href: "/shop?category=wallets",        emoji: "👛" },
  { label: "New In",         href: "/shop",                         emoji: "✨" },
  { label: "Best Sellers",   href: "/shop",                         emoji: "⭐" },
  { label: "Sale",           href: "/shop",                         emoji: "🏷️" },
];

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default async function HomePage() {
  const allProducts = await getProducts(12);
  const newIn       = allProducts.slice(0, 8);
  const bestSellers = allProducts.slice(0, 8);
  const collection  = allProducts.slice(0, 4);

  return (
    <div className="min-h-screen">

      {/* ── Announcement bar ── */}
      <div className="bg-neutral-100 border-b border-neutral-200 text-center py-2 px-4">
        <p className="text-[11px] font-medium text-neutral-700 tracking-wide">
          Free shipping &amp; easy returns for 365 days &nbsp;·&nbsp; Up to 40% off Spring Edit
        </p>
      </div>

      {/* ── Hero ── */}
      <section className="relative min-h-[420px] sm:min-h-[560px] lg:min-h-[680px] flex items-center justify-center text-center bg-neutral-900 overflow-hidden">
        <Image
          src="https://noirblancnyc.com/cdn/shop/files/hf_20260419_074456_069633e7-c7a8-4655-b052-bedc772e8603.png"
          alt="Noir & Blanc Hero"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="relative z-10 px-6 max-w-2xl mx-auto">
          <p className="text-[11px] tracking-[0.25em] uppercase font-medium text-amber-400 mb-4">Spring Edit</p>
          <h1 className="font-heading text-[36px] sm:text-[52px] lg:text-[64px] font-bold text-white leading-[1.05] mb-5 tracking-tight">
            Summer,<br />well crafted.
          </h1>
          <p className="text-[14px] text-white/60 mb-8 leading-relaxed">
            Timeless bags designed for real life — elegant, functional, and made to move with you.
          </p>
          <Link
            href="/shop"
            className="inline-block bg-white text-neutral-900 px-10 py-3.5 text-[11px] tracking-[0.18em] font-bold uppercase hover:bg-neutral-100 transition-colors"
          >
            Shop the Collection
          </Link>
        </div>
      </section>

      {/* ── Press strip ── */}
      <section className="py-6 px-4 sm:px-8 border-b border-[#CAD3BE]/40" style={{ backgroundColor: "#EAEEE3" }}>
        <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] sm:text-[13px] font-semibold tracking-wider uppercase text-neutral-700">
              As Seen On Sponsored Content
            </span>
            <span className="text-neutral-400 hidden sm:inline">|</span>
          </div>
          <span className="text-[18px] sm:text-[22px] font-black tracking-tight text-neutral-900">
            <span className="text-red-600">●</span> CBS NEWS
          </span>
          <span className="text-[18px] sm:text-[22px] font-bold lowercase tracking-tight text-neutral-900 italic">abc</span>
          <span className="text-[18px] sm:text-[22px] font-bold tracking-tight text-neutral-900 lowercase italic">
            <span style={{ color: "#7BC142" }}>✿</span> msn
          </span>
          <span className="text-[20px] sm:text-[26px] font-black tracking-tight" style={{ color: "#5F01D2" }}>
            yahoo<span className="text-red-600">!</span>
          </span>
        </div>
      </section>

      {/* ── Bestsellers grid ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#F8FAF8" }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Bestsellers</h2>
            <Link
              href="/shop"
              className="text-[12px] sm:text-sm font-bold tracking-widest uppercase text-neutral-900 border border-neutral-900 px-5 py-2.5 hover:bg-neutral-900 hover:text-white transition-colors"
            >
              Shop All
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {bestSellers.slice(0, 4).map((product) => {
              const savePct = product.onSale && product.salePrice && product.regularPrice
                ? Math.round((1 - parseFloat(product.salePrice.replace(/[^0-9.]/g, "")) / parseFloat(product.regularPrice.replace(/[^0-9.]/g, ""))) * 100)
                : 0;
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="block bg-white rounded-md overflow-hidden no-underline text-inherit group relative"
                >
                  {savePct > 0 && (
                    <span
                      className="absolute top-3 left-3 z-10 text-white text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full"
                      style={{ backgroundColor: "#538125" }}
                    >
                      {savePct}% Off
                    </span>
                  )}
                  <div className="aspect-square overflow-hidden bg-white p-4 sm:p-6">
                    {product.image ? (
                      <Image
                        src={product.image.sourceUrl}
                        alt={product.image.altText || product.name}
                        width={400}
                        height={400}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100" />
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <p className="text-[10px] sm:text-[11px] uppercase font-medium text-neutral-500 tracking-wider mb-1">
                      {product.productCategories?.nodes?.[0]?.name ?? "Bags"}
                    </p>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-amber-400 text-xs">★★★★★</span>
                      <span className="text-[11px] sm:text-xs text-neutral-500">(15,243)</span>
                    </div>
                    <h3 className="text-[13px] sm:text-sm font-semibold text-neutral-900 leading-snug truncate mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600 text-base sm:text-lg font-bold">
                        {formatPrice(product.onSale && product.salePrice ? product.salePrice : product.price)}
                      </span>
                      {product.onSale && product.regularPrice && (
                        <span className="text-neutral-400 text-xs sm:text-sm line-through">
                          {formatPrice(product.regularPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── UGC video strip ── */}
      <UGCStrip />

      {/* ── Category tiles ── */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-3 min-w-max sm:min-w-0 sm:grid sm:grid-cols-6">
            {CATEGORIES.map((cat) => (
              <Link key={cat.label} href={cat.href} className="flex flex-col items-center gap-2 no-underline group w-[80px] sm:w-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-100 rounded-full flex items-center justify-center text-2xl group-hover:bg-neutral-200 transition-colors">
                  {cat.emoji}
                </div>
                <span className="text-[11px] sm:text-[12px] font-medium text-neutral-700 text-center leading-tight">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── New In carousel ── */}
      <Carousel title="New In" viewAllHref="/shop" products={newIn} badges={{ 0: "New", 2: "New" }} />

      {/* ── Feature banner 1 — Spring Edit ── */}
      <section className="flex flex-col md:flex-row min-h-[400px] md:min-h-[480px]">
        <div className="flex-1 min-h-[240px] md:min-h-0" style={{ background: "linear-gradient(135deg,#2d5a6b,#1a3a45)" }} />
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-12 bg-neutral-50">
          <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-400 mb-3">Spring Edit</p>
          <h2 className="font-heading text-[28px] sm:text-[36px] font-bold text-neutral-900 leading-[1.15] mb-4">
            Your Spring,<br />Upgraded.
          </h2>
          <p className="text-[14px] text-neutral-500 leading-relaxed mb-7 max-w-sm">
            Up to 40% off our most-loved styles. 2 free straps and a keyring with every bag.
          </p>
          <div>
            <Link href="/shop" className="inline-block border border-neutral-900 text-neutral-900 px-7 py-3 text-[11px] tracking-[0.14em] font-bold uppercase hover:bg-neutral-900 hover:text-white transition-colors">
              Shop the Edit
            </Link>
          </div>
        </div>
      </section>

      {/* ── Best Sellers carousel ── */}
      <Carousel title="Best Sellers" viewAllHref="/shop" products={bestSellers} badges={{ 0: "Best Seller", 2: "Best Seller" }} />

      {/* ── Feature banner 2 — What Makes It Your Go-To Bag ── */}
      <section className="flex flex-col md:flex-row-reverse min-h-[400px] md:min-h-[480px]">
        <div className="flex-1 min-h-[240px] md:min-h-0" style={{ background: "linear-gradient(135deg,#c9a96e,#8b6f5e)" }} />
        <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-12 bg-neutral-50">
          <p className="text-[10px] tracking-[0.2em] uppercase font-semibold text-neutral-400 mb-3">Thoughtfully designed</p>
          <h2 className="font-heading text-[28px] sm:text-[36px] font-bold text-neutral-900 leading-[1.15] mb-4">
            What Makes It<br /><em>Your</em> Go-To Bag
          </h2>
          <p className="text-[14px] text-neutral-500 leading-relaxed mb-7 max-w-sm">
            All-day comfort, spacious interior, tech-friendly, weather resistant. Beautifully, effortlessly, every day.
          </p>
          <div>
            <Link href="/shop" className="inline-block border border-neutral-900 text-neutral-900 px-7 py-3 text-[11px] tracking-[0.14em] font-bold uppercase hover:bg-neutral-900 hover:text-white transition-colors">
              Shop all bags
            </Link>
          </div>
        </div>
      </section>

      {/* ── Shop the Collection grid ── */}
      <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[18px] sm:text-[22px] font-heading font-semibold text-neutral-900 tracking-tight">
            Shop the Collection
          </h2>
          <Link href="/shop" className="text-[12px] font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {collection.map((product, i) => (
            <ProductCard key={product.id} product={product} badge={i === 0 ? "Best Seller" : i === 1 ? "New" : undefined} />
          ))}
        </div>
      </section>

      {/* ── Trust row ── */}
      <section className="bg-neutral-50 border-t border-neutral-100 py-8 px-4 sm:px-8">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { icon: "🚚", title: "Free Shipping",  sub: "On orders over $75" },
            { icon: "↩️",  title: "Free Returns",   sub: "365-day returns" },
            { icon: "💳", title: "Secure Payment", sub: "256-bit SSL" },
            { icon: "🌿", title: "Sustainable",    sub: "Ethical production" },
          ].map(({ icon, title, sub }) => (
            <div key={title}>
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-[13px] font-semibold text-neutral-900">{title}</p>
              <p className="text-[12px] text-neutral-500">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section
        className="relative flex items-center justify-center text-center px-6 py-16 sm:py-24 min-h-[280px]"
        style={{ background: "linear-gradient(rgba(0,0,0,0.52),rgba(0,0,0,0.52)),linear-gradient(135deg,#1a1a1a,#3a3a3a)" }}
      >
        <div>
          <h2 className="font-heading text-[28px] sm:text-[40px] font-bold text-white tracking-tight mb-3 leading-tight">
            Worn Daily. Styled Your Way.
          </h2>
          <p className="text-white/60 text-[14px] mb-7 max-w-md mx-auto leading-relaxed">
            Elegant enough for dinner, effortless enough for errands.
          </p>
          <Link
            href="/shop"
            className="inline-block border border-white/80 text-white px-10 py-3.5 text-[11px] tracking-[0.18em] font-bold uppercase hover:bg-white hover:text-neutral-900 transition-colors"
          >
            Find Your Everyday Bag
          </Link>
        </div>
      </section>

    </div>
  );
}
