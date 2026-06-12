import Image from "next/image";
import Link from "next/link";
import { graphqlClient } from "@/lib/graphql/client";
import { GET_PRODUCTS } from "@/lib/graphql/queries";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/types";

/* ─── Data fetching ─────────────────────────────────────────────────────── */
async function getProducts(first = 4, after?: string): Promise<Product[]> {
  try {
    const data = await graphqlClient.request<{ products: { nodes: Product[] } }>(
      GET_PRODUCTS,
      { first, after: after ?? null }
    );
    return data.products.nodes;
  } catch {
    return [];
  }
}

/* ─── Press Logos ───────────────────────────────────────────────────────── */
const pressQuotes = [
  { text: '"Effortless luxury. The Noir & Blanc bag is the everyday staple that actually elevates your look."', source: "VOGUE" },
  { text: '"Minimal, versatile, and surprisingly roomy — Noir & Blanc has mastered the go-everywhere bag."', source: "marie claire", serif: true },
  { text: '"The bag that\'s quietly taking over street style — and your Instagram feed."', source: "COSMOPOLITAN" },
  { text: '"Polished enough for work, cool enough for the weekend. The bag you\'ll reach for every day."', source: "BAZAAR" },
];

/* ─── Color swatches ────────────────────────────────────────────────────── */
const swatches = [
  { bg: "#2d5a6b", label: "Blue Lagoon", active: true },
  { bg: "#c9a96e", label: "Camel", active: false },
  { bg: "#1a1a1a", label: "Noir", active: false },
  { bg: "#e8ddd0", label: "Ivory", active: false },
  { bg: "#8b6f5e", label: "Cocoa", active: false },
];

/* ─── Features ──────────────────────────────────────────────────────────── */
const features = [
  { icon: "◈", label: "All-Day Comfort" },
  { icon: "▣", label: "Spacious Interior" },
  { icon: "◉", label: "Tech Friendly" },
  { icon: "◈", label: "Weather Resistant" },
];

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default async function HomePage() {
  const [newIn, collection, recommended] = await Promise.all([
    getProducts(4),
    getProducts(4),
    getProducts(8),
  ]);
  // "Shop the Collection" — offset by showing products 5-8
  const collectionProducts = recommended.slice(4, 8).length >= 4
    ? recommended.slice(4, 8)
    : collection;
  const recommendedProducts = recommended.slice(0, 4);

  return (
    <div className="min-h-screen">

      {/* ── Announcement bar ── */}
      <div className="bg-neutral-900 text-white text-[11px] tracking-widest font-medium py-2.5 px-4 flex justify-center gap-10 overflow-hidden">
        {["SPRING EDIT — UP TO 40% OFF", "2 FREE STRAPS & KEYRING (WORTH $100)", "FREE SHIPPING ON ORDERS OVER $75"].map((item, i) => (
          <span key={i} className="whitespace-nowrap">{item}</span>
        ))}
      </div>

      {/* ── Hero — split layout ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[580px]">
        {/* Left: text */}
        <div className="flex flex-col justify-center px-10 md:px-16 py-16 md:py-20 bg-neutral-900 order-2 md:order-1">
          <p className="text-[11px] tracking-[0.2em] uppercase font-semibold text-amber-400 mb-4">
            Spring Edit
          </p>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-white leading-[1.1] mb-5 tracking-tight">
            Your Spring,<br />Upgraded
          </h1>
          <p className="text-[11px] tracking-[0.1em] uppercase text-neutral-400 mb-1">
            Up to 40% off
          </p>
          <p className="text-[13px] text-neutral-500 mb-8">
            2 Free Straps &amp; Keyring (worth $100)
          </p>
          <div>
            <Link
              href="/shop"
              className="inline-block bg-white text-neutral-900 px-8 py-3.5 text-[11px] tracking-[0.16em] font-bold uppercase hover:bg-neutral-200 transition-colors"
            >
              Shop Now
            </Link>
          </div>
          <div className="flex items-center gap-2 mt-7">
            <span className="text-amber-400 text-sm">★★★★★</span>
            <span className="text-neutral-500 text-[12px]">18,456 reviews</span>
          </div>
        </div>

        {/* Right: image */}
        <div className="relative overflow-hidden bg-neutral-800 min-h-[360px] md:min-h-0 order-1 md:order-2">
          <Image
            src="https://noirblancnyc.com/cdn/shop/files/hf_20260419_074456_069633e7-c7a8-4655-b052-bedc772e8603.png"
            alt="Noir & Blanc Spring Edit"
            fill
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* ── Press logos ── */}
      <section className="bg-neutral-50 border-t border-b border-neutral-200 py-10 px-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {pressQuotes.map((q, i) => (
            <div key={i} className="text-center">
              <p className="text-[12px] text-neutral-500 leading-[1.7] italic mb-3">{q.text}</p>
              <span className={`text-[13px] font-black tracking-[0.12em] text-neutral-900 ${q.serif ? "font-serif" : "uppercase"}`}>
                {q.source}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── New In ── */}
      <section className="py-16 px-4 sm:px-8 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-heading text-[28px] font-semibold text-neutral-900 tracking-tight">
            New In
          </h2>
          <Link href="/shop" className="text-[11px] tracking-[0.1em] uppercase font-semibold text-neutral-500 hover:text-neutral-900 transition-colors underline underline-offset-4">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {newIn.slice(0, 4).map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              badge={i === 0 || i === 2 ? "New" : undefined}
            />
          ))}
        </div>
      </section>

      {/* ── Shop by Color ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[340px]">
        {/* Left */}
        <div className="bg-stone-100 px-10 md:px-14 py-14 md:py-16 flex flex-col justify-center">
          <p className="text-[11px] tracking-[0.16em] uppercase font-semibold text-neutral-400 mb-3">
            Find your shade
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-neutral-900 leading-[1.2] mb-3">
            Which <em>Color</em> Matches<br />Your Mood?
          </h2>
          <p className="text-[13px] text-neutral-500 mb-7 leading-relaxed">
            Find your perfect match among our five signature shades.
          </p>
          <Link
            href="/shop"
            className="self-start inline-block bg-neutral-900 text-white px-7 py-3.5 text-[11px] tracking-[0.14em] font-bold uppercase hover:bg-neutral-700 transition-colors"
          >
            Shop by Color
          </Link>
        </div>
        {/* Right: color panel */}
        <div className="flex flex-col items-center justify-center gap-4 bg-[#2d5a6b] min-h-[240px]">
          <p className="font-heading text-[32px] font-bold text-white tracking-wide">Blue Lagoon</p>
          <div className="flex gap-3 mt-2">
            {swatches.map((s, i) => (
              <button
                key={i}
                type="button"
                aria-label={s.label}
                className={`w-5 h-5 rounded-full cursor-pointer border-2 transition-all ${s.active ? "border-white outline outline-2 outline-white outline-offset-1" : "border-transparent"}`}
                style={{ backgroundColor: s.bg }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Shop the Collection ── */}
      <section className="py-16 px-4 sm:px-8 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-heading text-[28px] font-semibold text-neutral-900 tracking-tight">
            Shop the Collection
          </h2>
          <Link href="/shop" className="text-[11px] tracking-[0.1em] uppercase font-semibold text-neutral-500 hover:text-neutral-900 transition-colors underline underline-offset-4">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {collectionProducts.slice(0, 4).map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              badge={i === 0 ? "Best Seller" : i === 1 ? "New" : undefined}
            />
          ))}
        </div>
      </section>

      {/* ── Feature Split ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[480px]">
        {/* Left: lifestyle image */}
        <div className="relative overflow-hidden bg-neutral-800 min-h-[320px] md:min-h-0">
          <Image
            src="https://noirblancnyc.com/cdn/shop/files/hf_20260419_074456_069633e7-c7a8-4655-b052-bedc772e8603.png"
            alt="Lifestyle"
            fill
            className="object-cover"
          />
        </div>
        {/* Right: features */}
        <div className="bg-neutral-50 px-10 md:px-14 py-14 md:py-16 flex flex-col justify-center">
          <p className="text-[11px] tracking-[0.16em] uppercase font-semibold text-neutral-400 mb-3">
            Thoughtfully designed
          </p>
          <h2 className="font-heading text-[34px] font-bold text-neutral-900 leading-[1.2] mb-3">
            What Makes It <em>Your</em><br />Go-To Bag
          </h2>
          <p className="text-[13px] text-neutral-500 leading-relaxed mb-8">
            Thoughtfully designed to fit your life — beautifully, effortlessly, and every day.
          </p>
          <div className="grid grid-cols-2 gap-5 mb-8">
            {features.map((f, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <span className="text-xl text-neutral-800">{f.icon}</span>
                <span className="text-[12px] font-semibold text-neutral-700 tracking-wide">{f.label}</span>
              </div>
            ))}
          </div>
          <Link
            href="/shop"
            className="self-start border border-neutral-900 text-neutral-900 px-7 py-3 text-[11px] tracking-[0.14em] font-bold uppercase hover:bg-neutral-900 hover:text-white transition-colors"
          >
            Shop All
          </Link>
        </div>
      </section>

      {/* ── Full-width banner ── */}
      <section
        className="relative flex items-center justify-center text-center px-8 py-20 min-h-[320px]"
        style={{ background: "linear-gradient(rgba(0,0,0,0.55),rgba(0,0,0,0.55)),linear-gradient(135deg,#2a2a2a,#4a4a4a)" }}
      >
        <div>
          <h2 className="font-heading text-4xl font-bold text-white tracking-tight mb-3">
            Worn Daily. Styled Your Way.
          </h2>
          <p className="text-white/70 text-sm mb-8 tracking-wide">
            Elegant enough for dinner, effortless enough for errands.
          </p>
          <Link
            href="/shop"
            className="inline-block border border-white/80 text-white px-9 py-3.5 text-[11px] tracking-[0.16em] font-bold uppercase hover:bg-white hover:text-neutral-900 transition-colors"
          >
            Find Your Everyday Bag
          </Link>
        </div>
      </section>

      {/* ── You might like these ── */}
      <section className="py-16 px-4 sm:px-8 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="font-heading text-[28px] font-semibold text-neutral-900 tracking-tight">
            You Might Like These
          </h2>
          <Link href="/shop" className="text-[11px] tracking-[0.1em] uppercase font-semibold text-neutral-500 hover:text-neutral-900 transition-colors underline underline-offset-4">
            View All
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {recommendedProducts.slice(0, 4).map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              badge={i === 0 ? "Best Seller" : i === 2 ? "New" : undefined}
            />
          ))}
        </div>
      </section>

    </div>
  );
}
