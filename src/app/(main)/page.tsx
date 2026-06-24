import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { graphqlClient } from "@/lib/graphql/client";
import { GET_PRODUCTS, GET_PRODUCTS_BY_SEARCH } from "@/lib/graphql/queries";
import ProductCard from "@/components/product/ProductCard";
import Carousel from "@/components/home/Carousel";
import UGCStrip from "@/components/home/UGCStrip";
import type { Product } from "@/types";

async function getProducts(first = 8, category?: string): Promise<Product[]> {
  try {
    const data = await graphqlClient.request<{ products: { nodes: Product[] } }>(
      GET_PRODUCTS, { first, category }
    );
    return data.products.nodes;
  } catch { return []; }
}

async function getLumaProducts(): Promise<Product[]> {
  try {
    const data = await graphqlClient.request<{ products: { nodes: Product[] } }>(
      GET_PRODUCTS_BY_SEARCH, { search: "Luma", first: 8 }
    );
    return data.products.nodes;
  } catch { return []; }
}

/* ── Async product sections — streamed after hero ── */
async function BestsellersSection() {
  const [allProducts, lumaProducts] = await Promise.all([getProducts(8), getLumaProducts()]);
  const bestSellers = lumaProducts.length >= 2 ? lumaProducts : allProducts.slice(0, 8);
  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#F8FAF8" }}>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Bestsellers</h2>
          <Link href="/shop" className="hidden md:inline-flex items-center justify-center border border-neutral-900 text-neutral-900 px-5 py-2 text-sm font-semibold uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors">
            Shop All
          </Link>
        </div>
        <div className="flex lg:grid overflow-x-auto lg:overflow-x-visible gap-2 md:gap-6 scroll-smooth snap-x snap-mandatory lg:snap-none lg:grid-cols-4" style={{ scrollbarWidth: "none" }}>
          {bestSellers.slice(0, 4).map((product, i) => (
            <div key={product.id} className="flex-shrink-0 w-[280px] md:w-auto snap-start">
              <ProductCard product={product} loading={i < 2 ? "eager" : "lazy"} />
            </div>
          ))}
        </div>
        <div className="w-full text-center md:hidden mt-6">
          <Link href="/shop" className="inline-flex items-center justify-center border border-neutral-900 text-neutral-900 px-5 py-2 text-sm font-semibold uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors">
            Shop All
          </Link>
        </div>
      </div>
    </section>
  );
}

async function NewInSection() {
  const [allProducts, newInProducts] = await Promise.all([getProducts(8), getProducts(8, "new-in")]);
  const newIn = newInProducts.length >= 2 ? newInProducts : allProducts.slice(0, 8);
  return <Carousel title="New In" viewAllHref="/shop" products={newIn} badges={{ 0: "New", 2: "New" }} />;
}

async function CollectionSection() {
  const [allProducts, strapProducts] = await Promise.all([getProducts(8), getProducts(4, "bag-straps")]);
  const collection = strapProducts.length >= 2 ? strapProducts : allProducts.slice(0, 4);
  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#F8FAF8" }}>
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Shop the Collection</h2>
          <Link href="/shop" className="hidden md:inline-flex items-center justify-center border border-neutral-900 text-neutral-900 px-5 py-2 text-sm font-semibold uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors">
            Shop All
          </Link>
        </div>
        <div className="flex lg:grid overflow-x-auto lg:overflow-x-visible gap-2 md:gap-6 scroll-smooth snap-x snap-mandatory lg:snap-none lg:grid-cols-4" style={{ scrollbarWidth: "none" }}>
          {collection.map((product, i) => (
            <div key={product.id} className="flex-shrink-0 w-[280px] md:w-auto snap-start">
              <ProductCard product={product} badge={i === 0 ? "Best Seller" : i === 1 ? "New" : undefined} />
            </div>
          ))}
        </div>
        <div className="w-full text-center md:hidden mt-6">
          <Link href="/shop" className="inline-flex items-center justify-center border border-neutral-900 text-neutral-900 px-5 py-2 text-sm font-semibold uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors">
            Shop All
          </Link>
        </div>
      </div>
    </section>
  );
}

async function BestSellersCarousel() {
  const [allProducts, lumaProducts] = await Promise.all([getProducts(8), getLumaProducts()]);
  const bestSellers = lumaProducts.length >= 2 ? lumaProducts : allProducts.slice(0, 8);
  return <Carousel title="Best Sellers" viewAllHref="/shop" products={bestSellers} badges={{ 0: "Best Seller", 2: "Best Seller" }} />;
}

/* ── Skeleton placeholders ── */
function ProductGridSkeleton() {
  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#F8FAF8" }}>
      <div className="max-w-[1400px] mx-auto">
        <div className="h-8 w-48 bg-neutral-200 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-neutral-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}

function CarouselSkeleton() {
  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="h-8 w-32 bg-neutral-200 rounded mb-6 animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[280px] aspect-[3/4] bg-neutral-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Page ── */
export default function HomePage() {
  return (
    <div className="min-h-screen">

      {/* Hero — renders immediately, no data needed */}
      <section className="relative min-h-[420px] sm:min-h-[560px] lg:min-h-[680px] flex items-center justify-center text-center bg-neutral-900 overflow-hidden">
        <Image
          src="/hero-beach.webp"
          alt="Noir & Blanc Hero"
          fill
          className="object-cover opacity-60"
          priority
          fetchPriority="high"
          sizes="100vw"
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

      {/* Press strip — no data needed */}
      <section style={{ backgroundColor: "#eaeee3" }}>
        <div className="py-4 lg:py-6">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-8">
            <div className="font-extrabold text-center lg:text-left text-[13.6px] tracking-[-0.28px] uppercase whitespace-nowrap" style={{ color: "#3d472d" }}>
              As seen on sponsored content.
            </div>
            <div className="w-px h-5 bg-[#2A2552] hidden lg:block shrink-0" />
            <div className="relative w-full overflow-hidden">
              <div className="flex md:hidden gap-8 whitespace-nowrap w-max items-center" style={{ animation: "marquee 25s linear infinite" }}>
                {[...Array(4)].flatMap((_, rep) => [
                  { alt: "CBS NEWS", src: "/press-logos/cbs-news.png" },
                  { alt: "ABC",      src: "/press-logos/abc.png" },
                  { alt: "MSN",      src: "/press-logos/msn.png" },
                  { alt: "Yahoo",    src: "/press-logos/yahoo.png" },
                ].map((logo, i) => (
                  <div key={`${rep}-${i}`} className="shrink-0 max-w-[130px] flex justify-center items-center">
                    <img alt={logo.alt} src={logo.src} width={130} height={40} className="h-10 w-fit object-contain" />
                  </div>
                )))}
              </div>
              <div className="hidden md:flex items-center justify-center lg:justify-between gap-4 xl:gap-8">
                {[
                  { alt: "CBS NEWS", src: "/press-logos/cbs-news.png" },
                  { alt: "ABC",      src: "/press-logos/abc.png" },
                  { alt: "MSN",      src: "/press-logos/msn.png" },
                  { alt: "Yahoo",    src: "/press-logos/yahoo.png" },
                ].map((logo) => (
                  <div key={logo.alt} className="max-w-[130px] flex justify-center items-center">
                    <img alt={logo.alt} src={logo.src} width={130} height={40} className="h-10 w-fit object-contain" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <style>{`@keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>
      </section>

      {/* Bestsellers — streamed */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <BestsellersSection />
      </Suspense>

      {/* UGC strip — no data needed */}
      <UGCStrip />

      {/* New In — streamed */}
      <Suspense fallback={<CarouselSkeleton />}>
        <NewInSection />
      </Suspense>

      {/* CTA banner — no data needed */}
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

      {/* Feature banner 1 */}
      <section className="flex flex-col md:flex-row min-h-[400px] md:min-h-[480px]">
        <div className="flex-1 min-h-[240px] md:min-h-0 relative overflow-hidden">
          <Image
            src="https://noirblanc.store/wp-content/uploads/2026/06/hf_20260419_074456_af48ec76-8c8e-4fc9-abf1-f77665f45fd1-1-scaled.png"
            alt="Spring Edit"
            fill
            className="object-cover"
            loading="lazy"
          />
        </div>
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

      {/* Best Sellers carousel — streamed */}
      <Suspense fallback={<CarouselSkeleton />}>
        <BestSellersCarousel />
      </Suspense>

      {/* Feature banner 2 */}
      <section className="flex flex-col md:flex-row-reverse min-h-[400px] md:min-h-[480px]">
        <div className="flex-1 min-h-[240px] md:min-h-0 relative overflow-hidden">
          <Image
            src="https://noirblanc.store/wp-content/uploads/2026/06/177688851369406459_1.png"
            alt="What Makes It Your Go-To Bag"
            fill
            className="object-cover"
            loading="lazy"
          />
        </div>
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

      {/* Shop the Collection — streamed */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <CollectionSection />
      </Suspense>

    </div>
  );
}
