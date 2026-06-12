"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  product: Product;
  badge?: string;
}

export default function ProductCard({ product, badge }: Props) {
  const secondImage = product.galleryImages?.nodes?.[0];
  const categoryName = product.productCategories?.nodes?.[0]?.name ?? "";

  return (
    <Link href={`/products/${product.slug}`} className="no-underline text-inherit block group">
      {/* Image — 4:5 aspect ratio matching Hydrogen */}
      <div className="relative overflow-hidden bg-neutral-100 aspect-[4/5] mb-3">
        {badge && (
          <span className="absolute top-3 left-3 z-10 bg-neutral-900 text-white text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1">
            {badge}
          </span>
        )}
        {product.onSale && !badge && (
          <span className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1">
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
          <div className="absolute inset-0 bg-neutral-200 flex items-center justify-center text-neutral-400 text-xs">
            No image
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-[13px] font-semibold text-neutral-900 mb-0.5 truncate">{product.name}</p>
      {categoryName && (
        <p className="text-[12px] text-neutral-400 mb-1.5">{categoryName}</p>
      )}
      <div className="flex gap-2 items-center">
        {product.onSale && product.salePrice ? (
          <>
            <span className="text-[12px] text-neutral-400 line-through">{formatPrice(product.regularPrice)}</span>
            <span className="text-[13px] font-bold text-red-600">{formatPrice(product.salePrice)}</span>
          </>
        ) : (
          <span className="text-[13px] font-bold text-neutral-900">{formatPrice(product.price)}</span>
        )}
      </div>
    </Link>
  );
}
