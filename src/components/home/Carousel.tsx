"use client";

import { useRef } from "react";
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
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    if (ref.current) ref.current.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  if (!products.length) return null;

  return (
    <section className="py-10 md:py-14">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-5">
        <h2 className="text-[18px] sm:text-[22px] font-heading font-semibold text-neutral-900 tracking-tight">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href={viewAllHref}
            className="text-[12px] font-medium text-neutral-600 underline underline-offset-2 hover:text-neutral-900 hidden sm:block"
          >
            View all
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scroll(-1)}
              className="w-8 h-8 border border-neutral-300 flex items-center justify-center hover:border-neutral-900 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              className="w-8 h-8 border border-neutral-300 flex items-center justify-center hover:border-neutral-900 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Scroll track */}
      <div
        ref={ref}
        className="flex gap-3 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {products.map((product, i) => (
          <div key={product.id} className="flex-none w-[160px] sm:w-[200px] md:w-[220px] snap-start">
            <ProductCard product={product} badge={badges[i]} />
          </div>
        ))}
      </div>

      {/* Mobile view-all */}
      <div className="px-4 sm:px-6 lg:px-8 mt-4 sm:hidden">
        <Link
          href={viewAllHref}
          className="block w-full text-center border border-neutral-900 text-neutral-900 py-2.5 text-[12px] font-semibold tracking-wide hover:bg-neutral-900 hover:text-white transition-colors"
        >
          View all
        </Link>
      </div>
    </section>
  );
}
