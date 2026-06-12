"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  product: Product;
  badge?: string;
}

function Stars() {
  return (
    <div className="flex items-center gap-1 mt-0.5">
      <span className="text-amber-400 text-[11px] leading-none">★★★★★</span>
      <span className="text-[11px] text-neutral-400">(243)</span>
    </div>
  );
}

export default function ProductCard({ product, badge }: Props) {
  const secondImage = product.galleryImages?.nodes?.[0];

  return (
    <Link href={`/products/${product.slug}`} className="group block no-underline text-inherit">
      {/* Image — 4:5 aspect ratio */}
      <div className="relative overflow-hidden bg-neutral-100 aspect-[4/5] mb-3">
        {badge && (
          <span className="absolute top-2 left-2 z-10 bg-white text-neutral-900 text-[10px] font-semibold tracking-wide px-2 py-0.5 shadow-sm">
            {badge}
          </span>
        )}
        {!badge && product.onSale && (
          <span className="absolute top-2 left-2 z-10 bg-white text-red-600 text-[10px] font-semibold tracking-wide px-2 py-0.5 shadow-sm">
            Sale
          </span>
        )}
        {product.image ? (
          <>
            <Image
              src={product.image.sourceUrl}
              alt={product.image.altText || product.name}
              fill
              className={`object-cover transition-transform duration-500 group-hover:scale-105 ${secondImage ? "group-hover:opacity-0" : ""}`}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {secondImage && (
              <Image
                src={secondImage.sourceUrl}
                alt={secondImage.altText || product.name}
                fill
                className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 bg-neutral-200" />
        )}
      </div>

      {/* Info */}
      <p className="text-[13px] font-medium text-neutral-900 leading-snug mb-0.5 line-clamp-2">{product.name}</p>
      <Stars />
      <div className="flex items-center gap-2 mt-1">
        {product.onSale && product.salePrice ? (
          <>
            <span className="text-[12px] text-neutral-400 line-through">{formatPrice(product.regularPrice)}</span>
            <span className="text-[13px] font-semibold text-red-600">{formatPrice(product.salePrice)}</span>
          </>
        ) : (
          <span className="text-[13px] font-semibold text-neutral-900">{formatPrice(product.price)}</span>
        )}
      </div>
    </Link>
  );
}
