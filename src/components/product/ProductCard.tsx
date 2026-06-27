"use client";

import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/context/CurrencyContext";
import type { Product } from "@/types";

interface Props {
  product: Product;
  badge?: string;
  loading?: "eager" | "lazy";
}

export default function ProductCard({ product, badge, loading }: Props) {
  const { formatPrice } = useCurrency();
  const price        = product.salePrice || product.price;
  const comparePrice = product.onSale ? product.regularPrice : null;

  const savePct =
    product.onSale && product.regularPrice && product.salePrice
      ? Math.round(
          (1 -
            parseFloat(product.salePrice.replace(/[^0-9.]/g, "")) /
              parseFloat(product.regularPrice.replace(/[^0-9.]/g, ""))) *
            100
        )
      : 0;

  const category = product.productCategories?.nodes?.[0]?.name ?? "Bags";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="block rounded-md overflow-hidden no-underline text-inherit group relative"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* ── Discount / badge pill (green, top-left) ── */}
      {(badge || savePct > 0) && (
        <span
          className="absolute top-3 left-3 z-10 text-white text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full"
          style={{ backgroundColor: "#538125" }}
        >
          {badge ?? `${savePct}% Off`}
        </span>
      )}

      {/* ── Image: square, forced white bg, padded, object-contain + scale on hover ── */}
      <div
        className="aspect-square overflow-hidden p-4 sm:p-6"
        style={{ backgroundColor: "#ffffff" }}
      >
        {product.image ? (
          <Image
            src={product.image.sourceUrl}
            alt={product.image.altText || product.name}
            width={400}
            height={400}
            loading={loading ?? "lazy"}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            sizes="(min-width:1024px) 25vw, 50vw"
            style={{ backgroundColor: "#ffffff" }}
          />
        ) : (
          <div className="w-full h-full" style={{ backgroundColor: "#ffffff" }} />
        )}
      </div>

      {/* ── Info ── */}
      <div className="p-3 sm:p-4">
        {/* Category */}
        <p className="text-[10px] sm:text-[11px] uppercase font-medium text-neutral-500 tracking-wider mb-1">
          {category}
        </p>

        {/* Stars */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-amber-400 text-xs">★★★★★</span>
        </div>

        {/* Title */}
        <h3 className="text-[13px] sm:text-sm font-semibold text-neutral-900 leading-snug truncate mb-2">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-red-600 text-base sm:text-lg font-bold">
            {formatPrice(price)}
          </span>
          {comparePrice && (
            <span className="text-neutral-400 text-xs sm:text-sm line-through">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
