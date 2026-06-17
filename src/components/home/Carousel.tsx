"use client";

import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/types";

interface Props {
  title: string;
  viewAllHref: string;
  products: Product[];
  badges?: Record<number, string>;
}

export default function Carousel({ title, viewAllHref, products, badges = {} }: Props) {
  if (!products.length) return null;

  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: "#F8FAF8" }}>
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">{title}</h2>
          <Link
            href={viewAllHref}
            className="hidden md:inline-flex items-center justify-center border border-neutral-900 text-neutral-900 px-5 py-2 text-sm font-semibold uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors"
          >
            Shop All
          </Link>
        </div>

        {/* Mobile: horizontal scroll | Desktop: 4-col grid */}
        <div
          className="flex lg:grid overflow-x-auto lg:overflow-x-visible gap-2 md:gap-6 scroll-smooth snap-x snap-mandatory lg:snap-none lg:grid-cols-4"
          style={{ scrollbarWidth: "none" }}
        >
          {products.slice(0, 4).map((product, i) => (
            <div key={product.id} className="flex-shrink-0 w-[280px] md:w-auto snap-start">
              <ProductCard product={product} badge={badges[i]} />
            </div>
          ))}
        </div>

        {/* Mobile-only Shop All */}
        <div className="w-full text-center md:hidden mt-6">
          <Link
            href={viewAllHref}
            className="inline-flex items-center justify-center border border-neutral-900 text-neutral-900 px-5 py-2 text-sm font-semibold uppercase tracking-widest hover:bg-neutral-900 hover:text-white transition-colors"
          >
            Shop All
          </Link>
        </div>
      </div>
    </section>
  );
}
